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
import { AlertCircle, Map, BarChart3, History as HistoryIcon, Edit2, Save, Download, Loader2, Trash2, FileText, RefreshCw, Activity, Plus } from 'lucide-react';
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
  NoCompsFound,
} from '@/components/comps-analysis';

// Logs Panel
import { LogsPanel, type LogEntry } from '@/components/comps-analysis/LogsPanel';

// API Diagnostics Panel
import { ApiDiagnosticsPanel } from '@/components/comps-analysis/ApiDiagnosticsPanel';

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
import { logger, setLogCallback } from '@/utils/logger';
import { AVMService } from '@/services/avmService';
import { validatePropertyData } from '@/utils/dataValidation';
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
  const [manualCompsFilter, setManualCompsFilter] = useState<'all' | 'with-manual' | 'without-manual'>('all');

  // Offer Management
  const [editingOffer, setEditingOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState<number>(0);

  // Comparables & Analysis
  const [comparables, setComparables] = useState<ComparableProperty[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [smartInsights, setSmartInsights] = useState<SmartInsightsType | null>(null);
  
  // Error states for no comps found
  const [compsError, setCompsError] = useState<{
    addressNotFound?: boolean;
    noResultsFound?: boolean;
    apiError?: boolean;
    message?: string;
  } | null>(null);

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

  // Logs Panel
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogsPanel, setShowLogsPanel] = useState(false);

  // API Diagnostics
  const [showApiDiagnostics, setShowApiDiagnostics] = useState(false);
  const [apiTestResults, setApiTestResults] = useState<{
    attom?: { status: 'testing' | 'success' | 'error', result?: any, error?: string };
    zillow?: { status: 'testing' | 'success' | 'error', result?: any, error?: string };
    county?: { status: 'testing' | 'success' | 'error', result?: any, error?: string };
  }>({});

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
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Convert manual links to ComparableProperty format
   * Now supports comp_data field with complete property information
   */
  const convertManualLinksToComparables = useCallback((manualLinks: any[]): ComparableProperty[] => {
    if (!manualLinks || manualLinks.length === 0) return [];

    logger.debug('Converting manual links to comparables', { count: manualLinks.length });

    return manualLinks.map((link, index) => {
      // Se tem dados completos no comp_data, usar eles como prioridade
      // comp_data pode ser string JSON ou objeto
      let compData: Record<string, any> = {};
      if (link.comp_data) {
        if (typeof link.comp_data === 'string') {
          try {
            compData = JSON.parse(link.comp_data);
          } catch (e) {
            console.warn('⚠️ Failed to parse comp_data as JSON:', e);
            compData = {};
          }
        } else {
          compData = link.comp_data as Record<string, any>;
        }
      }
      
      // Debug: log raw data
      if (index === 0) {
        console.log('🔍 Converting manual link:', {
          id: link.id,
          has_comp_data: !!link.comp_data,
          comp_data_type: typeof link.comp_data,
          comp_data: compData,
        });
      }

      // Usar comp_data se disponível (extrair valores de JSONB)
      const salePrice = Number(compData.sale_price || compData.salePrice) || 0;
      const squareFeet = Number(compData.square_feet || compData.squareFeet || compData.sqft) || 0;
      const bedrooms = Number(compData.bedrooms || compData.beds) || 0;
      const bathrooms = Number(compData.bathrooms || compData.baths) || 0;
      const saleDate = compData.sale_date || compData.saleDate || link.created_at || new Date().toISOString();
      const pricePerSqft = squareFeet > 0 ? salePrice / squareFeet : 0;
      
      // Debug: log converted values
      if (index === 0) {
        console.log('✅ Converted values:', {
          salePrice,
          squareFeet,
          pricePerSqft,
          bedrooms,
          bathrooms,
        });
      }

      return {
        id: link.id || `manual-${index}`,
        address: link.property_address || link.address || 'Manual Entry',
        sale_price: salePrice,
        sale_date: saleDate,
        square_feet: squareFeet,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        price_per_sqft: pricePerSqft,
        distance: link.distance || 0,
        source: 'manual',
        originalSource: link.source || 'other', // zillow, trulia, redfin, realtor, other
        url: link.url || '',
        notes: link.notes || '',
        similarity_score: 0.5,
        property_type: link.property_type || 'Single Family',
        year_built: link.year_built,
        lot_size: link.lot_size,
        salePrice: salePrice,
        saleDate: new Date(saleDate).toISOString(),
        sqft: squareFeet,
        beds: bedrooms,
        baths: bathrooms,
        pricePerSqft: pricePerSqft,
        distanceMiles: link.distance || 0,
        yearBuilt: link.year_built,
        lotSize: link.lot_size,
        latitude: link.latitude,
        longitude: link.longitude,
        similarityScore: 0.5,
        propertyType: link.property_type || 'Single Family',
      };
    });
  }, []);

  // ========================================
  // COMPUTED VALUES (MEMOIZED)
  // ========================================

  /**
   * Filter comparables based on active filters
   * INCLUDES MANUAL COMPS when on 'combined' or 'auto' tab
   */
  const filteredComparables = useMemo(() => {
    // Filter manual comps for ONLY the selected property
    const manualCompsForSelectedProperty = selectedProperty
      ? manualComps.filter(mc => mc.property_id === selectedProperty.id)
      : [];

    // Convert manual comps to comparable format
    const manualComparables = convertManualLinksToComparables(manualCompsForSelectedProperty);

    // Combine auto + manual if on combined tab, otherwise just auto
    const allComparables = activeTab === 'combined' || activeTab === 'auto'
      ? [...comparables, ...manualComparables]
      : comparables;

    return allComparables.filter((comp) => {
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
  }, [comparables, compsFilters, manualComps, activeTab, selectedProperty, convertManualLinksToComparables]);

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

      // Manual Comps filter
      const propertyManualComps = manualComps.filter(mc => mc.property_id === p.id);
      if (manualCompsFilter === 'with-manual' && propertyManualComps.length === 0) return false;
      if (manualCompsFilter === 'without-manual' && propertyManualComps.length > 0) return false;

      return true;
    });
  }, [properties, approvalStatusFilter, offerFilter, manualCompsFilter, manualComps]);

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
      avgDays: Math.round(avgDaysOnMarket),
      offerVsMarket: selectedProperty.cash_offer_amount
        ? ((selectedProperty.cash_offer_amount / analysis.avgSalePrice - 1) * 100)
        : 0,
      suggestion: suggestions.join('; '),
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
    logger.info('🔎 [CompsAnalysis] Iniciando geração de comparáveis', { property });
    try {
      setLoadingComps(true);
      const cacheKey = `${property.id}-${compsFilters.maxDistance || 3}`;
      const cached = compsCache[cacheKey];
      if (cached) {
        logger.info('💾 [CompsAnalysis] Usando comparáveis do cache', { property: property.address });
        setComparables(cached.comparables);
        setAnalysis(cached.analysis);
        setLoadingComps(false);
        return;
      }
      logger.info('🌐 [CompsAnalysis] Buscando novos comparáveis', { property: property.address });
      const compsData = await CompsDataService.getComparables(
        property.address || '',
        property.city || 'Orlando',
        property.state || 'FL',
        compsFilters.maxDistance || 3,
        10,
        property.estimated_value || 250000,
        true,
        property.latitude,
        property.longitude,
        property.zip_code
      );
      setCompsError(null);
      if (compsData && compsData.length > 0) {
        // Garante que todos os comps têm distance definido
        const compsWithDistance = compsData.map(c => ({
          ...c,
          distance: c.distance ?? 0
        }));
        const validation = AVMService.validateComps(compsWithDistance);
        logger.info('📊 [CompsAnalysis] Validação dos comps', { validation });
        if (validation.quality === 'poor') {
          toast({
            title: 'Warning',
            description: validation.issues.join('; '),
            variant: 'destructive'
          });
        }
        let calculatedValue = null;
        let avmMinValue = null;
        let avmMaxValue = null;
        let avmConfidence = null;
        try {
          // Buscar dados do banco antes de estimar dos comps
          let propertySqft = selectedProperty?.square_feet;
          let propertyBeds = selectedProperty?.bedrooms;
          let propertyBaths = selectedProperty?.bathrooms;
          if (!propertySqft || !propertyBeds || !propertyBaths) {
            const { data: propertyDetails } = await supabase
              .from('properties')
              .select('square_feet, bedrooms, bathrooms')
              .eq('id', selectedProperty.id)
              .single();
            propertySqft = propertySqft || propertyDetails?.square_feet;
            propertyBeds = propertyBeds || propertyDetails?.bedrooms;
            propertyBaths = propertyBaths || propertyDetails?.bathrooms;
            // Se ainda faltam valores, estimar dos comps
            if (!propertySqft || !propertyBeds || !propertyBaths) {
              const estimated = AVMService.estimateSubjectProperties(compsWithDistance);
              propertySqft = propertySqft || estimated.sqft;
              propertyBeds = propertyBeds || estimated.beds;
              propertyBaths = propertyBaths || estimated.baths;
              logger.info('📊 [CompsAnalysis] Usando valores estimados dos comps', { propertySqft, propertyBeds, propertyBaths });
            }
          }
          // Garante que todos os comps têm distance definido para AVM
          const compsForAVM = compsWithDistance;
          
          // Log antes de calcular AVM
          logger.avm('📊 Calculando AVM', {
            compsCount: compsForAVM.length,
            propertyDetails: {
              id: selectedProperty.id,
              address: selectedProperty.address,
              sqft: propertySqft,
              beds: propertyBeds,
              baths: propertyBaths
            }
          });
          
          const avm = AVMService.calculateValueFromComps(
            compsForAVM,
            propertySqft,
            propertyBeds,
            propertyBaths
          );
          calculatedValue = avm.estimatedValue;
          avmMinValue = avm.minValue;
          avmMaxValue = avm.maxValue;
          avmConfidence = avm.confidence;
          
          // Log resultado AVM detalhado
          logger.avm('✅ AVM calculado com sucesso', {
            estimatedValue: calculatedValue,
            confidence: avmConfidence,
            minValue: avmMinValue,
            maxValue: avmMaxValue
          });
          // Log antes de atualizar propriedade
          logger.db('💾 Atualizando propriedade com valores AVM', {
            propertyId: selectedProperty.id,
            propertyAddress: selectedProperty.address,
            valuesToUpdate: {
              estimated_value: calculatedValue,
              avm_min_value: avmMinValue,
              avm_max_value: avmMaxValue,
              valuation_method: 'avm',
              valuation_confidence: avmConfidence,
              last_valuation_date: new Date().toISOString()
            }
          });
          
          const { data: updatedProperty, error: updateError } = await supabase
            .from('properties')
            .update({
              estimated_value: calculatedValue
            })
            .eq('id', selectedProperty.id)
            .select()
            .single();
          
          if (updateError) {
            logger.db('❌ Erro ao atualizar propriedade', { error: updateError, propertyId: selectedProperty.id });
          } else {
            logger.db('✅ Propriedade atualizada com sucesso', {
              propertyId: selectedProperty.id,
              updatedValues: {
                estimated_value: updatedProperty?.estimated_value
              }
            });
          }
          setSelectedProperty(prev => prev ? {
            ...prev,
            estimated_value: calculatedValue
          } : null);
          toast({
            title: '✅ Property Valued',
            description: `Estimated Value: $${calculatedValue.toLocaleString()} (${Math.round(avmConfidence)}% confidence)`
          });
        } catch (avmError) {
          logger.warn('⚠️ [CompsAnalysis] AVM falhou, usando média dos comps', { avmError });
          const avgPrice = compsData.reduce((sum, c) => sum + c.salePrice, 0) / compsData.length;
          calculatedValue = Math.round(avgPrice);
          avmConfidence = 40;
        }
        const formattedComps: ComparableProperty[] = compsData
          .filter(comp => comp.salePrice && comp.sqft && comp.sqft > 0)
          .map((comp, index) => ({
            id: `comp-${index}`,
            address: comp.address || 'Unknown',
            city: comp.city || property.city,
            state: comp.state || property.state,
            zipCode: comp.zipCode || '',
            salePrice: Number(comp.salePrice) || 0,
            saleDate: comp.saleDate || new Date().toISOString(),
            sqft: Number(comp.sqft) || 1,
            beds: Number(comp.beds) || 0,
            baths: Number(comp.baths) || 0,
            pricePerSqft: Number(comp.salePrice) / Number(comp.sqft) || 0,
            distance: Number(comp.distance) || 0,
            latitude: comp.latitude,
            longitude: comp.longitude,
            similarityScore: 0.8,
            propertyType: comp.propertyType || 'Single Family',
            yearBuilt: comp.yearBuilt || undefined,
            sale_price: Number(comp.salePrice) || 0,
            sale_date: comp.saleDate || new Date().toISOString(),
            square_feet: Number(comp.sqft) || 1,
            bedrooms: Number(comp.beds) || 0,
            bathrooms: Number(comp.baths) || 0,
            price_per_sqft: Number(comp.salePrice) / Number(comp.sqft) || 0,
            similarity_score: 0.8,
            property_type: comp.propertyType || 'Single Family',
          }));
        if (formattedComps.length === 0) {
          logger.error('❌ [CompsAnalysis] Nenhum comparável válido encontrado', { property });
          throw new Error('No valid comparables found');
        }
        setComparables(formattedComps);
        const avgPrice = formattedComps.reduce((sum, c) => sum + (c.sale_price || 0), 0) / formattedComps.length || 0;
        const avgPricePerSqft = formattedComps.reduce((sum, c) => sum + (c.price_per_sqft || 0), 0) / formattedComps.length || 0;
        // Detectar fonte dos dados
        const detectedSource = compsData[0]?.source || 'demo';
        const isDemoData = detectedSource === 'demo';

        const calculatedAnalysis = {
          avgSalePrice: avgPrice,
          avgPricePerSqft: avgPricePerSqft,
          suggestedValueMin: avmMinValue || avgPrice * 0.9,
          suggestedValueMax: avmMaxValue || avgPrice * 1.1,
          marketTrend: 'stable' as const,
          trendPercentage: 0,
          medianSalePrice: avgPrice,
          comparablesCount: formattedComps.length,
          dataSource: detectedSource as 'attom' | 'zillow' | 'county-csv' | 'demo' | 'database',
          isDemo: isDemoData,
        };
        setAnalysis(calculatedAnalysis);
        setCompsCache(prev => ({
          ...prev,
          [cacheKey]: {
            comparables: formattedComps,
            analysis: calculatedAnalysis,
            timestamp: Date.now()
          }
        }));
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const payloadToSave = {
              property_id: property.id,
              analyst_user_id: user.id,
              analysis_data: {
                comparables: formattedComps.slice(0, 10),
                analysis: calculatedAnalysis,
              } as any,
              comparables_count: formattedComps.length,
              suggested_value_min: calculatedAnalysis.suggestedValueMin,
              suggested_value_max: calculatedAnalysis.suggestedValueMax,
              search_radius_miles: compsFilters.maxDistance || 3,
              data_source: compsData[0].source || dataSource,
              notes: 'Auto-saved on analysis generation',
            };
            
            // Log antes de salvar
            logger.db('💾 Salvando análise no banco de dados', {
              propertyId: property.id,
              propertyAddress: property.address,
              payload: {
                comparables_count: payloadToSave.comparables_count,
                data_source: payloadToSave.data_source,
                search_radius_miles: payloadToSave.search_radius_miles,
                suggested_value_min: payloadToSave.suggested_value_min,
                suggested_value_max: payloadToSave.suggested_value_max
              }
            });
            
            const { data: savedRecord, error: saveError } = await supabase
              .from('comps_analysis_history')
              .insert(payloadToSave as any)
              .select()
              .single();
            
            if (saveError) {
              logger.db('❌ Erro ao salvar análise no banco', { error: saveError, propertyId: property.id });
            } else {
              logger.db('✅ Análise salva com sucesso', {
                recordId: savedRecord?.id,
                propertyId: property.id,
                propertyAddress: property.address,
                comparablesCount: savedRecord?.comparables_count,
                dataSource: savedRecord?.data_source
              });
            }
          }
        } catch (saveError) {
          logger.db('❌ Falha ao auto-salvar no banco (não crítico)', { 
            error: saveError, 
            propertyId: property.id 
          });
        }
        toast({
          title: 'Success',
          description: `Found ${formattedComps.length} comparable properties (source: ${compsData[0].source})`,
        });
      } else {
        setComparables([]);
        setAnalysis(null);
        setCompsError({
          noResultsFound: true,
          message: 'No comparable properties found in this area. This may indicate: no recent sales, address not in database, or API configuration issues.'
        });
        logger.warn('⚠️ [CompsAnalysis] Nenhum comparável encontrado', { property });
        toast({
          title: 'No Comparables Found',
          description: 'No comparable properties were found for this address. Please verify the address or try a different property.',
          variant: 'default',
        });
      }
    } catch (error) {
      logger.error('❌ [CompsAnalysis] Erro ao gerar comparáveis', { error, property });
      setComparables([]);
      setAnalysis(null);
      setCompsError({
        apiError: true,
        message: error instanceof Error ? error.message : 'Failed to generate comparables'
      });
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
   * Clear cache and force fresh API fetch
   */
  const clearCacheAndRefresh = useCallback(async () => {
    if (!selectedProperty) {
      toast({
        title: 'No Property Selected',
        description: 'Please select a property first',
        variant: 'default',
      });
      return;
    }

    try {
      logger.info('🗑️ Clearing cache and refreshing comparables', { property: selectedProperty.address });

      // 1. Clear memory cache
      const cacheKey = `${selectedProperty.id}-${compsFilters.maxDistance || 3}`;
      setCompsCache(prev => {
        const newCache = { ...prev };
        delete newCache[cacheKey];
        return newCache;
      });
      logger.info('✅ Memory cache cleared', { cacheKey });

      // 2. Clear database cache (optional)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: deleteError } = await supabase
            .from('comps_analysis_history')
            .delete()
            .eq('property_id', selectedProperty.id)
            .eq('analyst_user_id', user.id);

          if (deleteError) {
            logger.warn('⚠️ Failed to clear database cache', deleteError);
          } else {
            logger.info('✅ Database cache cleared', { propertyId: selectedProperty.id });
          }
        }
      } catch (dbError) {
        logger.error('❌ Error clearing database cache', dbError);
      }

      // 3. Force new fetch
      toast({
        title: 'Cache Cleared',
        description: 'Fetching fresh data from API...',
        variant: 'default',
      });

      await generateComparables(selectedProperty);

      toast({
        title: 'Success',
        description: 'Fresh comparables loaded successfully',
        variant: 'default',
      });
    } catch (error) {
      logger.error('❌ Error in clearCacheAndRefresh', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh comparables',
        variant: 'destructive',
      });
    }
  }, [selectedProperty, compsFilters.maxDistance, generateComparables, toast]);


  /**
   * Load ALL manual comps for the current user (for filter counts)
   */
  const loadAllManualComps = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setManualComps([]);
        return;
      }

      const { data, error } = await supabase
        .from('manual_comps_links')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setManualComps(data || []);
      console.log('✅ Loaded all manual comps:', data?.length || 0);
    } catch (error) {
      console.error('Error loading all manual comps:', error);
      setManualComps([]);
    }
  }, []);

  /**
   * Load manual comps count for a specific property
   */
  const loadManualLinksCount = useCallback(async (propertyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setManualLinksCount(0);
        return;
      }

      const { data, count, error } = await supabase
        .from('manual_comps_links')
        .select('*', { count: 'exact' })
        .eq('property_id', propertyId)
        .eq('user_id', user.id);

      if (error) throw error;
      setManualLinksCount(count || 0);
    } catch (error) {
      console.error('Error loading manual links count:', error);
      setManualLinksCount(0);
    }
  }, []);

  /**
   * Test Attom API individually
   */
  const testAttomAPI = useCallback(async () => {
    if (!selectedProperty) {
      toast({
        title: 'No Property Selected',
        description: 'Please select a property first',
        variant: 'default',
      });
      return;
    }

    setApiTestResults(prev => ({ ...prev, attom: { status: 'testing' } }));
    logger.info('🧪 Testing Attom API', { property: selectedProperty.address });

    try {
      const { data, error } = await supabase.functions.invoke('fetch-comps', {
        body: {
          address: selectedProperty.address,
          city: selectedProperty.city,
          state: selectedProperty.state,
          zipCode: selectedProperty.zip_code,
          basePrice: selectedProperty.estimated_value,
          radius: compsFilters.maxDistance || 3,
          latitude: selectedProperty.latitude,
          longitude: selectedProperty.longitude,
          testSource: 'attom-v2' // Test only Attom
        }
      });

      if (error || !data?.comps || data.comps.length === 0) {
        const errorMsg = error?.message || data?.error || 'No comps found';
        logger.error('❌ Attom API test failed', { error: errorMsg, data });
        setApiTestResults(prev => ({
          ...prev,
          attom: {
            status: 'error',
            error: errorMsg,
            result: data
          }
        }));
        toast({
          title: 'Attom API Test Failed',
          description: errorMsg,
          variant: 'destructive',
        });
      } else {
        logger.info('✅ Attom API test successful', { count: data.comps.length });
        setApiTestResults(prev => ({
          ...prev,
          attom: {
            status: 'success',
            result: { count: data.comps.length, source: data.source, comps: data.comps }
          }
        }));
        toast({
          title: 'Attom API Test Successful',
          description: `Found ${data.comps.length} comparables`,
          variant: 'default',
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error('❌ Attom API test exception', { error: errorMsg });
      setApiTestResults(prev => ({
        ...prev,
        attom: { status: 'error', error: errorMsg }
      }));
      toast({
        title: 'Attom API Test Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  }, [selectedProperty, compsFilters.maxDistance, toast]);

  /**
   * Test Zillow API individually
   */
  const testZillowAPI = useCallback(async () => {
    if (!selectedProperty) {
      toast({
        title: 'No Property Selected',
        description: 'Please select a property first',
        variant: 'default',
      });
      return;
    }

    setApiTestResults(prev => ({ ...prev, zillow: { status: 'testing' } }));
    logger.info('🧪 Testing Zillow API', { property: selectedProperty.address });

    try {
      const { data, error } = await supabase.functions.invoke('fetch-comps', {
        body: {
          address: selectedProperty.address,
          city: selectedProperty.city,
          state: selectedProperty.state,
          zipCode: selectedProperty.zip_code,
          basePrice: selectedProperty.estimated_value,
          radius: compsFilters.maxDistance || 3,
          latitude: selectedProperty.latitude,
          longitude: selectedProperty.longitude,
          testSource: 'zillow' // Test only Zillow
        }
      });

      if (error || !data?.comps || data.comps.length === 0) {
        const errorMsg = error?.message || data?.error || 'No comps found';
        logger.error('❌ Zillow API test failed', { error: errorMsg, data });
        setApiTestResults(prev => ({
          ...prev,
          zillow: {
            status: 'error',
            error: errorMsg,
            result: data
          }
        }));
        toast({
          title: 'Zillow API Test Failed',
          description: errorMsg,
          variant: 'destructive',
        });
      } else {
        logger.info('✅ Zillow API test successful', { count: data.comps.length });
        setApiTestResults(prev => ({
          ...prev,
          zillow: {
            status: 'success',
            result: { count: data.comps.length, source: data.source, comps: data.comps }
          }
        }));
        toast({
          title: 'Zillow API Test Successful',
          description: `Found ${data.comps.length} comparables`,
          variant: 'default',
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error('❌ Zillow API test exception', { error: errorMsg });
      setApiTestResults(prev => ({
        ...prev,
        zillow: { status: 'error', error: errorMsg }
      }));
      toast({
        title: 'Zillow API Test Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  }, [selectedProperty, compsFilters.maxDistance, toast]);

  /**
   * Test County CSV API individually
   */
  const testCountyCSV = useCallback(async () => {
    if (!selectedProperty) {
      toast({
        title: 'No Property Selected',
        description: 'Please select a property first',
        variant: 'default',
      });
      return;
    }

    setApiTestResults(prev => ({ ...prev, county: { status: 'testing' } }));
    logger.info('🧪 Testing County CSV', { property: selectedProperty.address });

    try {
      const { data, error } = await supabase.functions.invoke('fetch-comps', {
        body: {
          address: selectedProperty.address,
          city: selectedProperty.city,
          state: selectedProperty.state,
          zipCode: selectedProperty.zip_code,
          basePrice: selectedProperty.estimated_value,
          radius: compsFilters.maxDistance || 3,
          latitude: selectedProperty.latitude,
          longitude: selectedProperty.longitude,
          testSource: 'county-csv' // Test only County CSV
        }
      });

      if (error || !data?.comps || data.comps.length === 0) {
        const errorMsg = error?.message || data?.error || 'No comps found';
        logger.error('❌ County CSV test failed', { error: errorMsg, data });
        setApiTestResults(prev => ({
          ...prev,
          county: {
            status: 'error',
            error: errorMsg,
            result: data
          }
        }));
        toast({
          title: 'County CSV Test Failed',
          description: errorMsg,
          variant: 'destructive',
        });
      } else {
        logger.info('✅ County CSV test successful', { count: data.comps.length });
        setApiTestResults(prev => ({
          ...prev,
          county: {
            status: 'success',
            result: { count: data.comps.length, source: data.source, comps: data.comps }
          }
        }));
        toast({
          title: 'County CSV Test Successful',
          description: `Found ${data.comps.length} comparables`,
          variant: 'default',
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error('❌ County CSV test exception', { error: errorMsg });
      setApiTestResults(prev => ({
        ...prev,
        county: { status: 'error', error: errorMsg }
      }));
      toast({
        title: 'County CSV Test Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  }, [selectedProperty, compsFilters.maxDistance, toast]);

  /**
   * Test all APIs sequentially
   */
  const testAllAPIs = useCallback(async () => {
    logger.info('🧪 Testing all APIs sequentially');
    await testAttomAPI();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
    await testZillowAPI();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testCountyCSV();
  }, [testAttomAPI, testZillowAPI, testCountyCSV]);

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
        await exportCompsToPDF(selectedProperty, comparables as any, analysis);
      } else {
        await exportCompsToSimplePDF(selectedProperty, comparables as any, analysis);
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
   * Uses cache hierarchy: 1. Memory cache, 2. Database cache, 3. API call
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
      const getComparablesForProperty = async (property: Property, forceRefresh = false) => {
        // Skip all caches if forceRefresh is true
        if (forceRefresh) {
          console.log('🔄 Force refresh enabled, skipping all caches for:', property.address);
        } else {
          // 1️⃣ Check MEMORY cache first (fastest)
          const cacheKey = `${property.id}-${compsFilters.maxDistance || 3}`;
          const cached = compsCache[cacheKey];

          if (cached) {
            console.log('✅ Using MEMORY cache for export:', property.address);
            // Also fetch manual comps even when using memory cache
            let manualCompsForProperty: ComparableProperty[] = [];
            try {
              const { data: manualLinks } = await supabase
                .from('manual_comps_links')
                .select('*')
                .eq('property_id', property.id)
                .order('created_at', { ascending: false });

              if (manualLinks && manualLinks.length > 0) {
                manualCompsForProperty = convertManualLinksToComparables(manualLinks);
                console.log(`✅ Found ${manualCompsForProperty.length} manual comps for cached export:`, property.address);
              }
            } catch (manualError) {
              console.warn('⚠️ Error fetching manual comps for cached export:', manualError);
            }

            // Combine cached comps with manual comps
            const allComps = [...(cached.comparables || []), ...manualCompsForProperty];
            const hasManualComps = manualCompsForProperty.length > 0;
            
            // Update analysis if manual comps were added
            let updatedAnalysis = cached.analysis;
            if (hasManualComps) {
              const avgSalePrice = allComps.reduce((sum: number, c: any) => sum + (c.salePrice || c.sale_price || 0), 0) / allComps.length || 0;
              const avgPricePerSqft = allComps.reduce((sum: number, c: any) => sum + (c.pricePerSqft || c.price_per_sqft || 0), 0) / allComps.length || 0;
              updatedAnalysis = {
                ...cached.analysis,
                avgSalePrice,
                avgPricePerSqft,
                medianSalePrice: avgSalePrice,
                suggestedValueMin: avgSalePrice * 0.95,
                suggestedValueMax: avgSalePrice * 1.05,
                comparablesCount: allComps.length,
                dataSource: 'combined' as const,
                isDemo: false,
              };
            }

            return { comparables: allComps, analysis: updatedAnalysis };
          }

          // 2️⃣ Check if this is the currently selected property (already loaded)
          if (selectedProperty?.id === property.id && comparables.length > 0 && analysis) {
            console.log('✅ Using CURRENT selection for export:', property.address);
            // Also fetch manual comps for current selection
            let manualCompsForProperty: ComparableProperty[] = [];
            try {
              const { data: manualLinks } = await supabase
                .from('manual_comps_links')
                .select('*')
                .eq('property_id', property.id)
                .order('created_at', { ascending: false });

              if (manualLinks && manualLinks.length > 0) {
                manualCompsForProperty = convertManualLinksToComparables(manualLinks);
                console.log(`✅ Found ${manualCompsForProperty.length} manual comps for current selection export:`, property.address);
              }
            } catch (manualError) {
              console.warn('⚠️ Error fetching manual comps for current selection export:', manualError);
            }

            // Combine current comps with manual comps
            const allComps = [...comparables, ...manualCompsForProperty];
            const hasManualComps = manualCompsForProperty.length > 0;
            
            // Update analysis if manual comps were added
            let updatedAnalysis = analysis;
            if (hasManualComps) {
              const avgSalePrice = allComps.reduce((sum: number, c: any) => sum + (c.salePrice || c.sale_price || 0), 0) / allComps.length || 0;
              const avgPricePerSqft = allComps.reduce((sum: number, c: any) => sum + (c.pricePerSqft || c.price_per_sqft || 0), 0) / allComps.length || 0;
              updatedAnalysis = {
                ...analysis,
                avgSalePrice,
                avgPricePerSqft,
                medianSalePrice: avgSalePrice,
                suggestedValueMin: avgSalePrice * 0.95,
                suggestedValueMax: avgSalePrice * 1.05,
                comparablesCount: allComps.length,
                dataSource: 'combined' as const,
                isDemo: false,
              };
            }

            return { comparables: allComps, analysis: updatedAnalysis };
          }

          // 3️⃣ Check DATABASE cache (comps_analysis_history)
          try {
            const { data: historyData } = await supabase
              .from('comps_analysis_history')
              .select('*')
              .eq('property_id', property.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (historyData && historyData.length > 0) {
              const savedAnalysis = historyData[0];
              const analysisData = savedAnalysis.analysis_data as any;

              // Check if cache is expired (expires_at < NOW())
              const isExpired = savedAnalysis.expires_at 
                ? new Date(savedAnalysis.expires_at) < new Date()
                : false;

              // ⚠️ SKIP demo data cache - use ONLY manual comps (NO API)
              if (savedAnalysis.data_source === 'demo' || isExpired) {
                console.log(`⚠️ Cache ${savedAnalysis.data_source === 'demo' ? 'contains demo data' : 'expired'}, using manual comps only (no API):`, property.address);
                
                // Fetch ONLY manual comps (no API call)
                let manualCompsForProperty: ComparableProperty[] = [];
                try {
                  const { data: manualLinks } = await supabase
                    .from('manual_comps_links')
                    .select('*')
                    .eq('property_id', property.id)
                    .order('created_at', { ascending: false });

                  if (manualLinks && manualLinks.length > 0) {
                    console.log(`📦 Raw manual links found (demo/expired cache):`, manualLinks.length);
                    manualCompsForProperty = convertManualLinksToComparables(manualLinks);
                    console.log(`✅ Found ${manualCompsForProperty.length} manual comps (demo/expired cache):`, property.address);
                    
                    if (manualCompsForProperty.length > 0) {
                      const avgSalePrice = manualCompsForProperty.reduce((sum: number, c: any) => sum + (c.salePrice || c.sale_price || 0), 0) / manualCompsForProperty.length || 0;
                      const avgPricePerSqft = manualCompsForProperty.reduce((sum: number, c: any) => sum + (c.pricePerSqft || c.price_per_sqft || 0), 0) / manualCompsForProperty.length || 0;
                      
                      const manualAnalysis = {
                        avgSalePrice: avgSalePrice || 0,
                        medianSalePrice: avgSalePrice || 0,
                        avgPricePerSqft: avgPricePerSqft || 0,
                        suggestedValueMin: (avgSalePrice || 0) * 0.95,
                        suggestedValueMax: (avgSalePrice || 0) * 1.05,
                        trendPercentage: 0,
                        marketTrend: 'stable' as const,
                        comparablesCount: manualCompsForProperty.length,
                        dataSource: 'manual' as const,
                        isDemo: false,
                      };
                      
                      return { comparables: manualCompsForProperty, analysis: manualAnalysis };
                    }
                  }
                } catch (manualError) {
                  console.warn('⚠️ Error fetching manual comps (demo/expired cache):', manualError);
                }
                
                // If no manual comps, continue to section 4 (which will throw error)
                console.log(`📍 No manual comps found (demo/expired cache), will show error in PDF`);
              } else if (analysisData?.comparables && analysisData?.analysis) {
                console.log('✅ Using DATABASE cache for export:', property.address);

                // Also fetch manual comps for this property (even when using cache)
                let manualCompsForProperty: ComparableProperty[] = [];
                try {
                  const { data: manualLinks } = await supabase
                    .from('manual_comps_links')
                    .select('*')
                    .eq('property_id', property.id)
                    .order('created_at', { ascending: false });

                  if (manualLinks && manualLinks.length > 0) {
                    manualCompsForProperty = convertManualLinksToComparables(manualLinks);
                    console.log(`✅ Found ${manualCompsForProperty.length} manual comps for cached export:`, property.address);
                  }
                } catch (manualError) {
                  console.warn('⚠️ Error fetching manual comps for cached export:', manualError);
                }

                // Combine cached comps with manual comps
                const allComps = [...(analysisData.comparables || []), ...manualCompsForProperty];

                // Preserve dataSource from database field or analysis object or comps
                const compsSource = analysisData.comparables?.[0]?.source;
                const hasManualComps = manualCompsForProperty.length > 0;
                const detectedSource = hasManualComps 
                  ? 'combined' 
                  : (savedAnalysis.data_source || compsSource || analysisData.analysis?.dataSource || 'database');
                
                const restoredAnalysis = {
                  ...analysisData.analysis,
                  dataSource: detectedSource as 'attom' | 'zillow' | 'county-csv' | 'demo' | 'database' | 'combined' | 'manual',
                  isDemo: !hasManualComps && (savedAnalysis.data_source || compsSource || 'database') === 'demo',
                  comparablesCount: allComps.length,
                };

                // Recalculate averages if manual comps were added
                if (hasManualComps) {
                  const avgSalePrice = allComps.reduce((sum: number, c: any) => sum + (c.salePrice || c.sale_price || 0), 0) / allComps.length || 0;
                  const avgPricePerSqft = allComps.reduce((sum: number, c: any) => sum + (c.pricePerSqft || c.price_per_sqft || 0), 0) / allComps.length || 0;
                  restoredAnalysis.avgSalePrice = avgSalePrice;
                  restoredAnalysis.avgPricePerSqft = avgPricePerSqft;
                  restoredAnalysis.medianSalePrice = avgSalePrice;
                  restoredAnalysis.suggestedValueMin = avgSalePrice * 0.95;
                  restoredAnalysis.suggestedValueMax = avgSalePrice * 1.05;
                }

                // Update memory cache for next time
                setCompsCache(prev => ({
                  ...prev,
                  [cacheKey]: {
                    comparables: allComps,
                    analysis: restoredAnalysis,
                    timestamp: Date.now()
                  }
                }));

                return { comparables: allComps, analysis: restoredAnalysis };
              }
            }
          } catch (dbError) {
            console.warn('Database cache check failed:', dbError);
          }
        }

        // 4️⃣ Use ONLY manual comps (NO API calls during PDF export)
        console.log(`📍 Checking for manual comps only (no API): ${property.address}`);
        
        let manualCompsForProperty: ComparableProperty[] = [];
        try {
          const { data: manualLinks } = await supabase
            .from('manual_comps_links')
            .select('*')
            .eq('property_id', property.id)
            .order('created_at', { ascending: false });

          if (manualLinks && manualLinks.length > 0) {
            console.log(`📦 Raw manual links found:`, manualLinks.length, manualLinks.map(l => ({ 
              id: l.id, 
              has_comp_data: !!l.comp_data,
              comp_data: l.comp_data,
            })));
            
            manualCompsForProperty = convertManualLinksToComparables(manualLinks);
            
            console.log(`✅ Converted ${manualCompsForProperty.length} manual comps for export:`, property.address);
            console.log(`📊 First comp data:`, manualCompsForProperty[0] ? {
              salePrice: manualCompsForProperty[0].salePrice,
              sqft: manualCompsForProperty[0].sqft,
              pricePerSqft: manualCompsForProperty[0].pricePerSqft
            } : 'none');
          } else {
            console.log(`📍 No manual comps for ${property.address}, skipping (no API call)`);
          }
        } catch (manualError) {
          console.warn('⚠️ Error fetching manual comps for export:', manualError);
        }

        // If no manual comps found, return empty (PDF will show message)
        if (manualCompsForProperty.length === 0) {
          console.log(`❌ No manual comparables found for: ${property.address} (using manual-only mode, no API calls)`);
          throw new Error('No comparables found for this property');
        }

        // Calculate analysis from manual comps only
        const avgSalePrice = manualCompsForProperty.reduce((sum: number, c: any) => {
          const price = c.salePrice || c.sale_price || 0;
          return sum + price;
        }, 0) / manualCompsForProperty.length || 0;
        
        const avgPricePerSqft = manualCompsForProperty.reduce((sum: number, c: any) => {
          const pricePerSqft = c.pricePerSqft || c.price_per_sqft || 0;
          return sum + pricePerSqft;
        }, 0) / manualCompsForProperty.length || 0;
        
        console.log(`💰 Calculated analysis: avgSalePrice=${avgSalePrice}, avgPricePerSqft=${avgPricePerSqft}`);

        const calculatedAnalysis = {
          avgSalePrice: avgSalePrice || 0,
          medianSalePrice: avgSalePrice || 0,
          avgPricePerSqft: avgPricePerSqft || 0,
          suggestedValueMin: (avgSalePrice || 0) * 0.95,
          suggestedValueMax: (avgSalePrice || 0) * 1.05,
          trendPercentage: 0,
          marketTrend: 'stable' as const,
          comparablesCount: manualCompsForProperty.length,
          dataSource: 'manual' as const,
          isDemo: false,
        };

        return { comparables: manualCompsForProperty, analysis: calculatedAnalysis };
      };

      await exportConsolidatedCompsPDF(
        filteredProperties,
        getComparablesForProperty as any,
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
   * Export all filtered properties to PDF with force refresh (ignore cache)
   */
  const exportAllAnalysesForceRefresh = useCallback(async () => {
    if (filteredProperties.length === 0) {
      toast({
        title: 'No properties to export',
        description: 'Please select at least one property',
        variant: 'destructive',
      });
      return;
    }

    try {
      setExportingPDF(true);

      console.log('🔄 FORCE REFRESH: Exporting all properties with fresh data from API');

      // Function to get comparables for each property (with force refresh)
      const getComparablesForPropertyForceRefresh = async (property: Property) => {
        // Always skip caches and fetch fresh from API
        console.log('🔄 Force refresh enabled, skipping all caches for:', property.address);

        // Fetch from API
        console.log('🔄 Fetching NEW data from API for export:', property.address);
        try {
          const compsData = await CompsDataService.getComparables(
            property.address || '',
            property.city || 'Orlando',
            property.state || 'FL',
            compsFilters.maxDistance || 3,
            10,
            property.estimated_value || 250000,
            true, // useCache
            property.latitude,
            property.longitude,
            property.zip_code
          );

          // Also fetch manual comps for this property
          let manualCompsForProperty: ComparableProperty[] = [];
          try {
            const { data: manualLinks } = await supabase
              .from('manual_comps_links')
              .select('*')
              .eq('property_id', property.id)
              .order('created_at', { ascending: false });

            if (manualLinks && manualLinks.length > 0) {
              manualCompsForProperty = convertManualLinksToComparables(manualLinks);
              console.log(`✅ Found ${manualCompsForProperty.length} manual comps for export:`, property.address);
            }
          } catch (manualError) {
            console.warn('⚠️ Error fetching manual comps for export:', manualError);
          }

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
              distanceMiles: Number(comp.distance) || 0, // PDF export compatibility
              pricePerSqft: Number(comp.salePrice) / Number(comp.sqft) || 0,
              latitude: comp.latitude,
              longitude: comp.longitude,
              // Legacy fields for PDF export
              sale_price: Number(comp.salePrice) || 0,
              sale_date: comp.saleDate || new Date().toISOString(),
              square_feet: Number(comp.sqft) || 1,
              bedrooms: Number(comp.beds) || 0,
              bathrooms: Number(comp.baths) || 0,
              price_per_sqft: Number(comp.salePrice) / Number(comp.sqft) || 0,
            }));

          // Combine API comps with manual comps
          const allComps = [...formattedComps, ...manualCompsForProperty];

          if (allComps.length === 0) {
            console.warn(`⚠️ No valid comparables found for property: ${property.address}`);
            throw new Error('No valid comparables found for this property');
          }

          const avgSalePrice = allComps.reduce((sum: number, c: any) => sum + (c.salePrice || 0), 0) / allComps.length || 0;
          const avgPricePerSqft = allComps.reduce((sum: number, c: any) => sum + (c.pricePerSqft || 0), 0) / allComps.length || 0;

          // Detectar fonte dos dados (para PDF export)
          // Se tem manual comps, usar "combined", senão usar source da API
          const hasManualComps = manualCompsForProperty.length > 0;
          const detectedSource = hasManualComps 
            ? 'combined' 
            : (compsData[0]?.source || 'database');
          const isDemoData = !hasManualComps && detectedSource === 'demo';

          const calculatedAnalysis = {
            avgSalePrice: avgSalePrice || 0,
            medianSalePrice: avgSalePrice || 0,
            avgPricePerSqft: avgPricePerSqft || 0,
            suggestedValueMin: (avgSalePrice || 0) * 0.95,
            suggestedValueMax: (avgSalePrice || 0) * 1.05,
            trendPercentage: 0,
            marketTrend: 'stable' as const,
            comparablesCount: allComps.length,
            dataSource: detectedSource as 'attom' | 'zillow' | 'county-csv' | 'demo' | 'database' | 'combined' | 'manual',
            isDemo: isDemoData,
          };

          return { comparables: allComps, analysis: calculatedAnalysis };
        } catch (error) {
          // Log error with more context - let PDF export handle it gracefully
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('No valid comparables found')) {
            console.warn(`⚠️ Skipping property ${property.address}: ${errorMessage}`);
          } else {
            console.error(`❌ Error processing property ${property.address}:`, error);
          }
          throw error; // Re-throw so PDF export can show error message
        }
      };

      // Export consolidated PDF with force refresh function
      await exportConsolidatedCompsPDF(
        filteredProperties,
        getComparablesForPropertyForceRefresh as any,
        (current, total) => {
          console.log(`Exporting ${current}/${total} properties...`);
        }
      );

      toast({
        title: 'Export complete',
        description: `Successfully exported ${filteredProperties.length} properties with fresh data`,
      });
    } catch (error) {
      console.error('Error exporting all analyses with force refresh:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export consolidated PDF with fresh data',
        variant: 'destructive',
      });
    } finally {
      setExportingPDF(false);
    }
  }, [filteredProperties, compsFilters, convertManualLinksToComparables, toast]);

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
    loadAllManualComps(); // Load all manual comps for filter counts

    // Check if first time user
    const hasSeenOnboarding = localStorage.getItem('comps_onboarding_seen');
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, [fetchProperties, loadAllManualComps]);

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

  // Connect logger callback to capture logs in UI
  useEffect(() => {
    const MAX_LOGS = 100; // Limit to prevent memory issues

    setLogCallback((log) => {
      setLogs(prev => {
        const newLogs = [...prev, {
          timestamp: log.timestamp,
          level: log.level,
          message: `${log.prefix} ${log.message}`,
          data: log.data
        }];
        // Keep only last MAX_LOGS entries
        return newLogs.slice(-MAX_LOGS);
      });
    });

    return () => {
      setLogCallback(null as any);
    };
  }, []);

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
        onSelectProperty={(p: Property) => handleSelectProperty(p.id)}
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
        <div className="flex gap-2">
          <Button
            onClick={exportAllAnalyses}
            variant="default"
            disabled={exportingPDF || filteredProperties.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {exportingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export All Filtered ({filteredProperties.length})
          </Button>
          <Button
            variant="outline"
            onClick={clearCacheAndRefresh}
            disabled={!selectedProperty || loadingComps}
            title="Clear cache and fetch fresh data from API"
          >
            {loadingComps ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Clear Cache
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowLogsPanel(!showLogsPanel)}
            className="relative"
          >
            <FileText className="h-4 w-4 mr-2" />
            Logs
            {logs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {logs.length > 99 ? '99+' : logs.length}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowApiDiagnostics(!showApiDiagnostics)}
            disabled={!selectedProperty}
            title="Test individual APIs and view diagnostics"
          >
            <Activity className="h-4 w-4 mr-2" />
            API Diagnostics
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowApiConfig(true)}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
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

            {/* Manual Comps Filter */}
            <div className="border-t pt-3">
              <Label className="text-sm font-semibold mb-2 block">Filter by Manual Comps:</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={manualCompsFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setManualCompsFilter('all')}
                  className={manualCompsFilter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  All Properties
                </Button>
                <Button
                  variant={manualCompsFilter === 'with-manual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setManualCompsFilter('with-manual')}
                  className={manualCompsFilter === 'with-manual' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                >
                  📋 Has Manual Comps ({properties.filter(p => manualComps.filter(mc => mc.property_id === p.id).length > 0).length})
                </Button>
                <Button
                  variant={manualCompsFilter === 'without-manual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setManualCompsFilter('without-manual')}
                  className={manualCompsFilter === 'without-manual' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}
                >
                  ⚠️ No Manual Comps ({properties.filter(p => manualComps.filter(mc => mc.property_id === p.id).length === 0).length})
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
            <div className="flex gap-4">
              {/* Property Photo */}
              {selectedProperty.property_image_url && (
                <div className="flex-shrink-0">
                  <img
                    src={selectedProperty.property_image_url}
                    alt={selectedProperty.address}
                    className="w-[500px] h-[375px] object-cover rounded-lg border-2 border-green-300 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Offer Amount Section */}
              <div className="flex-1 space-y-3">
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Offer Calculator */}
      {selectedProperty && analysis && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">💰 Quick Offer Calculator</Label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: '70%', percent: 0.70, color: 'bg-red-600 hover:bg-red-700' },
                  { label: '75%', percent: 0.75, color: 'bg-orange-600 hover:bg-orange-700' },
                  { label: '80%', percent: 0.80, color: 'bg-amber-600 hover:bg-amber-700' },
                  { label: '85%', percent: 0.85, color: 'bg-yellow-600 hover:bg-yellow-700' },
                  { label: '90%', percent: 0.90, color: 'bg-green-600 hover:bg-green-700' },
                ].map((offer) => {
                  const avgPrice = analysis.avgSalePrice || selectedProperty.estimated_value || 0;
                  const offerValue = Math.round(avgPrice * offer.percent);

                  return (
                    <button
                      key={offer.label}
                      onClick={() => setOfferAmount(offerValue)}
                      className={`${offer.color} text-white p-3 rounded-lg transition-all hover:scale-105 shadow-md`}
                    >
                      <div className="text-xs font-semibold">{offer.label}</div>
                      <div className="text-lg font-bold">${Math.round(offerValue / 1000)}K</div>
                      <div className="text-xs opacity-90">${offerValue.toLocaleString()}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on avg sale price of ${Math.round((analysis.avgSalePrice || 0) / 1000)}K. Click to set offer amount.
              </p>
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
              onExportAllForceRefresh={exportAllAnalysesForceRefresh}
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
            <div className="flex items-center justify-between gap-4 mb-4">
              <TabsList className="grid flex-1 grid-cols-4">
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

              {/* Quick Add Comp Button - Always visible */}
              <Button
                onClick={() => setActiveTab('manual')}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Comp
              </Button>
            </div>

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

                  {filteredComparables.length > 0 ? (
                    <CompsTable
                      comparables={filteredComparables}
                      onViewDetails={handleViewCompDetails}
                      onOpenMap={handleOpenOnMap}
                      onToggleFavorite={toggleFavorite}
                      favorites={favorites}
                    />
                  ) : (
                    !loadingComps && (
                      <NoCompsFound
                        addressNotFound={compsError?.addressNotFound}
                        noResultsFound={compsError?.noResultsFound}
                        apiError={compsError?.apiError}
                        message={compsError?.message}
                        address={selectedProperty?.address}
                        city={selectedProperty?.city}
                      />
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manual Comps Tab */}
            <TabsContent value="manual">
              <ManualCompsManager
                preSelectedPropertyId={selectedProperty.id}
                onLinkAdded={() => {
                  loadManualLinksCount(selectedProperty.id);
                  loadAllManualComps(); // Refresh filter counts
                }}
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

          {/* Logs Panel */}
          {showLogsPanel && (
            <LogsPanel
              logs={logs}
              onClear={() => setLogs([])}
              onClose={() => setShowLogsPanel(false)}
              show={showLogsPanel}
            />
          )}

          {/* API Diagnostics Panel */}
          {showApiDiagnostics && selectedProperty && (
            <ApiDiagnosticsPanel
              property={selectedProperty}
              compsFilters={compsFilters}
            />
          )}
        </>
      )}

      {/* API Settings Dialog */}
      {showApiConfig && (
        <CompsApiSettings />
      )}

      {/* Adjustment Calculator */}
      {showAdjustmentCalc && selectedProperty && filteredComparables.length > 0 && (
        <AdjustmentCalculator
          open={showAdjustmentCalc}
          onOpenChange={setShowAdjustmentCalc}
          compAddress={filteredComparables[0]?.address || selectedProperty.address}
          basePrice={filteredComparables[0]?.salePrice || filteredComparables[0]?.sale_price || selectedProperty.estimated_value}
          onApplyAdjustments={(adjustedPrice, adjustments) => {
            console.log('Adjusted price:', adjustedPrice, adjustments);
            setShowAdjustmentCalc(false);
          }}
        />
      )}
    </div>
  );
};

export default CompsAnalysis;
