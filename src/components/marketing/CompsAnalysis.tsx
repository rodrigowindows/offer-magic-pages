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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  RefreshCw,
  Share2,
  MessageSquare,
  Percent,
  Settings,
  Database,
  Link as LinkIcon,
  AlertCircle,
  Target,
  Edit2,
  Star,
  ArrowUpDown,
  CheckCircle2,
  Copy,
  ChevronRight,
  ChevronDown,
  History,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportCompsToPDF, exportCompsToSimplePDF, exportConsolidatedCompsPDF } from '@/utils/pdfExport';
import { CompsMapboxMap } from './CompsMapboxMap';
import { CompsComparison } from './CompsComparison';
import { CompsComparisonGrid } from './CompsComparisonGrid';
import { CompsDataService } from '@/services/compsDataService';
import { CompsApiSettings } from '@/components/CompsApiSettings';
import { ManualCompsManager } from '@/components/ManualCompsManager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { geocodeAddress } from '@/services/geocodingService';
import { loadGeocodeCache } from '@/utils/geocodingCache';
import { AdjustmentCalculator } from '@/components/AdjustmentCalculator';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value: number;
  cash_offer_amount: number;
  property_image_url?: string | null;
  approval_status?: string | null;
  approved_at?: string | null;
  // Physical characteristics
  square_feet?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  year_built?: number | null;
  lot_size?: number | null;
  property_type?: string | null;
  // Analysis metadata
  comps_count?: number;
  last_analysis_date?: string | null;
  analysis_status?: 'complete' | 'partial' | 'pending';
}

interface OfferHistoryItem {
  id: string;
  property_id: string;
  previous_amount: number | null;
  new_amount: number;
  changed_by: string;
  changed_at: string;
  notes: string | null;
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
  // Investment analysis fields
  units?: number;
  totalRent?: number;
  rentPerUnit?: number;
  expenseRatio?: number;
  noi?: number;
  capRate?: number;
  condition?: 'reformed' | 'good' | 'needs_work' | 'as-is';
  // Quality scoring
  qualityScore?: number;
  scoreBreakdown?: {
    proximity: number;
    sqftSimilarity: number;
    recency: number;
    propertyType: number;
    bedrooms: number;
  };
  // Adjustments
  adjustments?: {
    conditionAdjustment: number; // %
    poolAdjustment: number; // $
    garageSpaces: number;
    recentRenovation: number; // $
    lotSizeAdjustment: number; // $/sqft
    customAdjustments: Array<{ name: string; amount: number; }>;
  };
  adjustedPrice?: number;
}

interface MarketAnalysis {
  avgSalePrice: number;
  avgPricePerSqft: number;
  suggestedValueMin: number;
  suggestedValueMax: number;
  marketTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  // Investment metrics
  avgCapRate?: number;
  avgNOI?: number;
  avgRentPerUnit?: number;
}

/**
 * Calculate quality score for a comparable property (1-10)
 * Based on: proximity, sqft similarity, recency, property type match, bedroom match
 */
const calculateCompScore = (
  comp: ComparableProperty,
  subject: { sqft: number; beds: number; units?: number }
): { score: number; breakdown: any } => {
  let totalScore = 0;
  const breakdown = {
    proximity: 0,
    sqftSimilarity: 0,
    recency: 0,
    propertyType: 0,
    bedrooms: 0,
  };

  // 1. Proximity Score (0-3 points)
  if (comp.distanceMiles <= 0.25) {
    breakdown.proximity = 3;
  } else if (comp.distanceMiles <= 0.5) {
    breakdown.proximity = 2.5;
  } else if (comp.distanceMiles <= 1) {
    breakdown.proximity = 2;
  } else if (comp.distanceMiles <= 2) {
    breakdown.proximity = 1;
  } else {
    breakdown.proximity = 0.5;
  }

  // 2. Sqft Similarity (0-3 points)
  const sqftDiff = Math.abs(comp.sqft - subject.sqft) / subject.sqft;
  if (sqftDiff <= 0.10) {
    breakdown.sqftSimilarity = 3; // ±10%
  } else if (sqftDiff <= 0.20) {
    breakdown.sqftSimilarity = 2; // ±20%
  } else if (sqftDiff <= 0.30) {
    breakdown.sqftSimilarity = 1; // ±30%
  } else {
    breakdown.sqftSimilarity = 0.5;
  }

  // 3. Recency (0-2 points)
  const monthsAgo = (new Date().getTime() - new Date(comp.saleDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsAgo <= 3) {
    breakdown.recency = 2; // ≤3 months
  } else if (monthsAgo <= 6) {
    breakdown.recency = 1.5; // ≤6 months
  } else if (monthsAgo <= 12) {
    breakdown.recency = 1; // ≤12 months
  } else {
    breakdown.recency = 0.5;
  }

  // 4. Property Type Match (0-1 point)
  const isMultiFamily = (subject.units && subject.units > 1) || false;
  const compIsMultiFamily = (comp.units && comp.units > 1) || false;
  if (isMultiFamily === compIsMultiFamily) {
    breakdown.propertyType = 1;
  }

  // 5. Bedroom Match (0-1 point)
  if (comp.beds === subject.beds) {
    breakdown.bedrooms = 1;
  } else if (Math.abs(comp.beds - subject.beds) === 1) {
    breakdown.bedrooms = 0.5;
  }

  totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { score: Math.min(10, totalScore), breakdown };
};

/**
 * Get quality badge info based on score
 */
const getScoreBadge = (score: number) => {
  if (score >= 8) {
    return { label: 'Excellent', color: 'bg-green-600', textColor: 'text-white' };
  } else if (score >= 5) {
    return { label: 'Good', color: 'bg-blue-600', textColor: 'text-white' };
  } else {
    return { label: 'Fair', color: 'bg-yellow-600', textColor: 'text-white' };
  }
};

/**
 * Calculate adjusted price based on manual adjustments
 */
const calculateAdjustedPrice = (
  basePrice: number,
  adjustments: ComparableProperty['adjustments']
): number => {
  if (!adjustments) return basePrice;

  let adjusted = basePrice;

  // Condition adjustment (percentage)
  adjusted *= (1 + adjustments.conditionAdjustment / 100);

  // Pool adjustment (dollar amount)
  adjusted += adjustments.poolAdjustment;

  // Garage (dollar per space)
  adjusted += adjustments.garageSpaces * 10000;

  // Recent renovation
  adjusted += adjustments.recentRenovation;

  // Lot size adjustment
  adjusted += adjustments.lotSizeAdjustment;

  // Custom adjustments
  adjustments.customAdjustments.forEach(adj => {
    adjusted += adj.amount;
  });

  return Math.round(adjusted);
};

export const CompsAnalysis = () => {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [comparables, setComparables] = useState<ComparableProperty[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [editingOffer, setEditingOffer] = useState(false);
  const [newOfferAmount, setNewOfferAmount] = useState<number>(0);
  const [analysisNotes, setAnalysisNotes] = useState<string>('');
  // Filters
  const [minCapRate, setMinCapRate] = useState<number>(0);
  const [filterUnits, setFilterUnits] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'capRate' | 'price' | 'date' | 'noi'>('date');
  const [offerStatusFilter, setOfferStatusFilter] = useState<'all' | 'approved' | 'manual' | 'none'>('all');
  const [showOnlyApproved, setShowOnlyApproved] = useState(false);
  // Comparison
  const [selectedCompsForComparison, setSelectedCompsForComparison] = useState<string[]>([]);
  // Geocoding with persistent cache
  const [geocodedLocations, setGeocodedLocations] = useState<Record<string, { lat: number; lng: number }>>(() => {
    const cache = loadGeocodeCache();
    const simplified: Record<string, { lat: number; lng: number }> = {};
    Object.entries(cache).forEach(([key, value]) => {
      simplified[key] = { lat: value.lat, lng: value.lng };
    });
    return simplified;
  });
  // UX Improvements
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [searchRadius, setSearchRadius] = useState(() => {
    const saved = localStorage.getItem('comps_search_radius');
    return saved ? parseFloat(saved) : 1;
  });
  const [dataSource, setDataSource] = useState<string>('demo');
  const [activeTab, setActiveTab] = useState<'auto' | 'manual' | 'combined'>('auto');
  const [manualLinksCount, setManualLinksCount] = useState<number>(0);
  const [offerHistory, setOfferHistory] = useState<OfferHistoryItem[]>([]);
  const [showOfferHistory, setShowOfferHistory] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [showAnalysisHistory, setShowAnalysisHistory] = useState(false);
  const [loadingComps, setLoadingComps] = useState(false);
  const [manualComps, setManualComps] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('comps_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchProperties();

    // Check if first time user
    const hasSeenOnboarding = localStorage.getItem('comps_onboarding_seen');
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      generateComparables(selectedProperty);
      loadManualLinksCount(selectedProperty.id);
      loadOfferHistory(selectedProperty.id);
      loadAnalysisHistory(selectedProperty.id);
    }
  }, [selectedProperty]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S - Save analysis
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (selectedProperty && analysis && comparables.length > 0) {
          saveReport();
        }
      }
      // Ctrl+E or Cmd+E - Export PDF
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (selectedProperty && !exportingPDF) {
          exportToPDF(false);
        }
      }
      // Ctrl+R or Cmd+R - Refresh comps
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (selectedProperty && !loadingComps) {
          setLoadingComps(true);
          fetchComparables().then(() => setLoadingComps(false));
        }
      }
      // Ctrl+K or Cmd+K - Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedProperty, analysis, comparables, exportingPDF, loadingComps]);

  // Load manual links count for selected property
  const loadManualLinksCount = async (propertyId: string) => {
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
  };

  // Load offer history for selected property
  const loadOfferHistory = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('property_offer_history')
        .select('*')
        .eq('property_id', propertyId)
        .order('changed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setOfferHistory(data || []);
    } catch (error) {
      console.error('Error loading offer history:', error);
      setOfferHistory([]);
    }
  };

  const loadAnalysisHistory = async (propertyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAnalysisHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('comps_analysis_history')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnalysisHistory(data || []);
    } catch (error) {
      console.error('Error loading analysis history:', error);
      setAnalysisHistory([]);
    }
  };

  useEffect(() => {
    if (comparables.length > 0) {
      calculateAnalysis();
    }
  }, [comparables]);

  // Geocode subject property and comparables when they change
  useEffect(() => {
    const geocodeAll = async () => {
      console.log('🗺️ Starting geocoding process...');

      if (selectedProperty) {
        const fullAddress = `${selectedProperty.address}, ${selectedProperty.city}, ${selectedProperty.state} ${selectedProperty.zip_code}`;
        console.log('🏠 Geocoding subject property:', fullAddress);
        const location = await geocodeAddress(fullAddress);
        if (location) {
          setGeocodedLocations(prev => ({
            ...prev,
            [fullAddress]: location
          }));
        }
      }

      console.log(`📊 Geocoding ${comparables.length} comparables...`);
      for (let i = 0; i < comparables.length; i++) {
        const comp = comparables[i];
        console.log(`  ${i + 1}/${comparables.length}:`, comp.address);
        const location = await geocodeAddress(comp.address);
        if (location) {
          setGeocodedLocations(prev => ({
            ...prev,
            [comp.address]: location
          }));
        }
        // Service handles rate limiting automatically (1 req/sec)
      }

      console.log('✅ Geocoding complete!');
    };

    if (selectedProperty || comparables.length > 0) {
      geocodeAll();
    }
  }, [selectedProperty, comparables]);

  const fetchProperties = async () => {
    try {
      const { data, error} = await supabase
        .from('properties')
        .select('id, address, city, state, zip_code, estimated_value, cash_offer_amount, property_image_url, approval_status, approved_at, square_feet, bedrooms, bathrooms, year_built, lot_size, property_type')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Enrich properties with analysis metadata
      const enrichedProperties = await Promise.all((data || []).map(async (property) => {
        try {
          // Get analysis history count
          const { data: historyData } = await supabase
            .from('comps_analysis_history')
            .select('created_at, analysis_data')
            .eq('property_id', property.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastAnalysis = historyData?.[0];
          let compsCount = 0;
          let analysisStatus: 'complete' | 'partial' | 'pending' = 'pending';

          if (lastAnalysis?.analysis_data) {
            const analysisData = typeof lastAnalysis.analysis_data === 'string'
              ? JSON.parse(lastAnalysis.analysis_data)
              : lastAnalysis.analysis_data;
            compsCount = analysisData.comps?.length || 0;

            // Determine status based on comps count and data completeness
            if (compsCount >= 5 && analysisData.avgSalePrice) {
              analysisStatus = 'complete';
            } else if (compsCount > 0) {
              analysisStatus = 'partial';
            }
          }

          return {
            ...property,
            comps_count: compsCount,
            last_analysis_date: lastAnalysis?.created_at || null,
            analysis_status: analysisStatus,
          };
        } catch (err) {
          console.error('Error enriching property:', err);
          return {
            ...property,
            comps_count: 0,
            last_analysis_date: null,
            analysis_status: 'pending' as const,
          };
        }
      }));

      setProperties(enrichedProperties);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load properties',
        variant: 'destructive',
      });
    }
  };


  const generateComparables = async (property: Property) => {
    setLoading(true);
    try {
      // Try to fetch real data first using CompsDataService
      console.log('🔍 Fetching comps using CompsDataService...');

      const realComps = await CompsDataService.getComparables(
        property.address,
        property.city,
        property.state,
        searchRadius,
        10,
        property.estimated_value || 250000
      );

      // Check if we got real data
      if (realComps && realComps.length > 0) {
        const source = (realComps[0] as any).source || 'demo';
        setDataSource(source);
        console.log(`✅ Got ${realComps.length} comps from source: ${source}`);

        // Convert to ComparableProperty format
        const formattedComps: ComparableProperty[] = realComps.map((comp, i) => {
          const sqft = comp.sqft || 1500;
          const salePrice = comp.salePrice || 250000;
          const pricePerSqft = Math.round(salePrice / sqft);
          const units = 1;
          const rentPerUnit = Math.round((salePrice * 0.008) / units);
          const totalRent = rentPerUnit * units;
          const expenseRatio = 0.55;
          const noi = Math.round(totalRent * 12 * (1 - expenseRatio));
          const capRate = salePrice > 0 ? (noi / salePrice) * 100 : 0;

          const comparable: ComparableProperty = {
            id: `comp-${i}`,
            address: comp.address,
            saleDate: new Date(comp.saleDate),
            salePrice,
            sqft,
            beds: comp.beds || 3,
            baths: comp.baths || 2,
            yearBuilt: comp.yearBuilt || 2000,
            lotSize: 5000,
            distanceMiles: comp.distance || 0.5,
            daysOnMarket: 30,
            adjustment: 0,
            pricePerSqft,
            units,
            totalRent,
            rentPerUnit,
            expenseRatio: Math.round(expenseRatio * 100) / 100,
            noi,
            capRate: Math.round(capRate * 100) / 100,
            condition: 'good' as const,
          };

          // Calculate quality score using real property data when available
          const scoring = calculateCompScore(comparable, {
            sqft: property.square_feet || 1500, // Use real sqft or default to 1500
            beds: property.bedrooms || 3, // Use real beds or default to 3
            units: 1,
          });

          comparable.qualityScore = Math.round(scoring.score * 10) / 10;
          comparable.scoreBreakdown = scoring.breakdown;

          return comparable;
        });

        // Sort by quality score (highest first)
        formattedComps.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));

        console.log('📊 Comps with scores:', formattedComps.map(c => ({
          address: c.address,
          score: c.qualityScore
        })));

        setComparables(formattedComps);
        return;
      }

      // Fallback to demo data if API returns nothing
      console.log('⚠️ No real data available, using demo data...');
      setDataSource('demo');

      // Generate sample comparables data (for demo/testing)
      const baseValue = property.estimated_value || 250000;
      const variance = baseValue * 0.15; // 15% variance

      // Real addresses in Orlando area for demo purposes
      const sampleAddresses = [
        `100 S Eola Dr, Orlando, FL 32801`,
        `400 W Church St, Orlando, FL 32801`,
        `555 N Orange Ave, Orlando, FL 32801`,
        `1000 E Colonial Dr, Orlando, FL 32803`,
        `2000 S Orange Ave, Orlando, FL 32806`,
      ];

      const comps: ComparableProperty[] = Array.from({ length: 5 }, (_, i) => {
        const sqft = 1200 + Math.floor(Math.random() * 800);
        const salePrice = Math.round(baseValue + (Math.random() * variance * 2 - variance));
        const pricePerSqft = Math.round(salePrice / sqft);
        const daysAgo = 5 + Math.floor(Math.random() * 180); // 6 months max
        const beds = 2 + Math.floor(Math.random() * 3);
        const baths = 1 + Math.floor(Math.random() * 2.5);
        const lotSize = 5000 + Math.floor(Math.random() * 5000);

        // Investment metrics
        const units = Math.floor(Math.random() * 2) === 0 ? 1 : Math.floor(Math.random() * 3) + 2;
        const rentPerUnit = Math.round((salePrice * 0.008) / units);
        const totalRent = rentPerUnit * units;
        const expenseRatio = 0.50 + (Math.random() * 0.15);
        const noi = Math.round(totalRent * 12 * (1 - expenseRatio));
        const capRate = salePrice > 0 ? (noi / salePrice) * 100 : 0;

        const conditions: Array<'reformed' | 'good' | 'needs_work' | 'as-is'> = ['reformed', 'good', 'needs_work', 'as-is'];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];

        return {
          id: `comp-${i}`,
          address: sampleAddresses[i],
          saleDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          salePrice,
          sqft,
          beds,
          baths,
          yearBuilt: 1980 + Math.floor(Math.random() * 40),
          lotSize,
          distanceMiles: 0.1 + Math.random() * 0.9,
          daysOnMarket: 10 + Math.floor(Math.random() * 60),
          adjustment: 0,
          pricePerSqft,
          units,
          totalRent,
          rentPerUnit,
          expenseRatio: Math.round(expenseRatio * 100) / 100,
          noi,
          capRate: Math.round(capRate * 100) / 100,
          condition,
        };
      });

      setComparables(comps);
    } catch (error: any) {
      toast({
        title: 'Error loading comparables',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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

    // Calculate investment metrics
    const compsWithInvestment = comparables.filter(c => c.capRate && c.capRate > 0);
    const avgCapRate = compsWithInvestment.length > 0
      ? Math.round((compsWithInvestment.reduce((sum, c) => sum + (c.capRate || 0), 0) / compsWithInvestment.length) * 100) / 100
      : undefined;

    const avgNOI = compsWithInvestment.length > 0
      ? Math.round(compsWithInvestment.reduce((sum, c) => sum + (c.noi || 0), 0) / compsWithInvestment.length)
      : undefined;

    const avgRentPerUnit = compsWithInvestment.length > 0
      ? Math.round(compsWithInvestment.reduce((sum, c) => sum + (c.rentPerUnit || 0), 0) / compsWithInvestment.length)
      : undefined;

    setAnalysis({
      avgSalePrice,
      avgPricePerSqft,
      suggestedValueMin,
      suggestedValueMax,
      marketTrend,
      trendPercentage: Math.round(trendPercentage * 10) / 10,
      avgCapRate,
      avgNOI,
      avgRentPerUnit,
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

  // Export all filtered properties in a single consolidated PDF
  const exportAllFiltered = async (withImages: boolean = false) => {
    const filteredProperties = properties.filter(property => {
      if (offerStatusFilter === 'all') return true;
      if (offerStatusFilter === 'approved') return property.approval_status === 'approved';
      if (offerStatusFilter === 'manual') return property.cash_offer_amount > 0 && property.approval_status !== 'approved';
      if (offerStatusFilter === 'none') return !property.cash_offer_amount || property.cash_offer_amount === 0;
      return true;
    });

    if (filteredProperties.length === 0) {
      toast({
        title: 'No Properties',
        description: 'No properties match the current filter',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm(
      `Export consolidated PDF with ${filteredProperties.length} properties?\n\n` +
      `This will create ONE single PDF file with all ${offerStatusFilter === 'all' ? 'properties' : offerStatusFilter + ' properties'} and their comparables WITH PHOTOS.\n\n` +
      `This may take a few minutes.`
    );

    if (!confirmed) return;

    setExportingPDF(true);

    try {
      toast({
        title: 'Generating Consolidated PDF',
        description: `Processing ${filteredProperties.length} properties with images...`,
      });

      // Function to generate comparables for each property
      const getComparablesForProperty = async (property: Property) => {
        const baseValue = property.estimated_value || 250000;
        const variance = baseValue * 0.15;

        const sampleAddresses = [
          `100 S Eola Dr, Orlando, FL 32801`,
          `400 W Church St, Orlando, FL 32801`,
          `555 N Orange Ave, Orlando, FL 32801`,
          `1000 E Colonial Dr, Orlando, FL 32803`,
          `2000 S Orange Ave, Orlando, FL 32806`,
        ];

        const comps = Array.from({ length: 5 }, (_, i) => {
          const sqft = 1200 + Math.floor(Math.random() * 800);
          const salePrice = Math.round(baseValue + (Math.random() * variance * 2 - variance));
          const pricePerSqft = Math.round(salePrice / sqft);
          const daysAgo = 5 + Math.floor(Math.random() * 180);

          return {
            id: `comp-${i}`,
            address: sampleAddresses[i],
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

        const avgSalePrice = comps.reduce((sum, c) => sum + c.salePrice, 0) / comps.length;
        const avgPricePerSqft = comps.reduce((sum, c) => sum + c.pricePerSqft, 0) / comps.length;

        const analysis = {
          avgSalePrice,
          avgPricePerSqft: Math.round(avgPricePerSqft),
          suggestedValueMin: Math.round(avgSalePrice * 0.85),
          suggestedValueMax: Math.round(avgSalePrice * 1.15),
          marketTrend: 'stable' as const,
          trendPercentage: 0,
        };

        return { comparables: comps, analysis };
      };

      // Export consolidated PDF with progress
      await exportConsolidatedCompsPDF(
        filteredProperties,
        getComparablesForProperty,
        (current, total) => {
          if (current % 3 === 0 || current === total) {
            toast({
              title: 'Progress',
              description: `Processing property ${current} of ${total}...`,
            });
          }
        }
      );

      toast({
        title: 'Export Complete! ✅',
        description: `Successfully exported ONE consolidated PDF with ${filteredProperties.length} properties and their photos`,
      });
    } catch (error: any) {
      console.error('Consolidated Export Error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export consolidated PDF',
        variant: 'destructive',
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const saveReport = async () => {
    if (!selectedProperty || comparables.length === 0 || !analysis) return;

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

      // Save to comps_analysis_history table
      const { error } = await supabase
        .from('comps_analysis_history')
        .insert({
          property_id: selectedProperty.id,
          analyst_user_id: user.id,
          comparables_data: comparables,
          analysis_data: {
            comps: comparables,
            avgSalePrice: analysis.avgSalePrice,
            avgPricePerSqft: analysis.avgPricePerSqft,
            marketTrend: analysis.marketTrend,
          },
          market_analysis: analysis,
          suggested_value_min: analysis.suggestedValueMin,
          suggested_value_max: analysis.suggestedValueMax,
          notes: analysisNotes || null,
          search_radius_miles: searchRadius,
          data_source: dataSource,
        });

      if (error) throw error;

      // Reload analysis history and properties to update metadata
      await loadAnalysisHistory(selectedProperty.id);
      await fetchProperties();

      // Clear notes after saving
      setAnalysisNotes('');

      toast({
        title: '✅ Analysis Saved Successfully',
        description: `Saved ${comparables.length} comps for ${selectedProperty.address}`,
        action: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAnalysisHistory(true)}
          >
            View History
          </Button>
        ),
      });
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast({
        title: '❌ Erro ao Salvar',
        description: error.message || 'Falha ao salvar relatório',
        variant: 'destructive',
      });
    }
  };

  const updatePropertyOffer = async (newOffer: number) => {
    if (!selectedProperty) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const previousAmount = selectedProperty.cash_offer_amount;

      // Update property offer
      const { error } = await supabase
        .from('properties')
        .update({ cash_offer_amount: newOffer })
        .eq('id', selectedProperty.id);

      if (error) throw error;

      // Save to history
      const { error: historyError } = await supabase
        .from('property_offer_history')
        .insert({
          property_id: selectedProperty.id,
          previous_amount: previousAmount,
          new_amount: newOffer,
          changed_by: user.id,
        });

      if (historyError) console.error('Error saving to history:', historyError);

      // Reload history
      loadOfferHistory(selectedProperty.id);

      // Update local state
      setSelectedProperty({ ...selectedProperty, cash_offer_amount: newOffer });
      setProperties(prev =>
        prev.map(p => (p.id === selectedProperty.id ? { ...p, cash_offer_amount: newOffer } : p))
      );

      setEditingOffer(false);

      toast({
        title: 'Oferta Atualizada',
        description: `Nova oferta: $${newOffer.toLocaleString()}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao Atualizar Oferta',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const setOfferToAverage = () => {
    if (!analysis) return;
    setNewOfferAmount(analysis.avgSalePrice);
    setEditingOffer(true);
  };

  const setOfferToPercentage = (percentage: number) => {
    if (!analysis) return;
    const offerAmount = Math.round(analysis.avgSalePrice * percentage);
    setNewOfferAmount(offerAmount);
    setEditingOffer(true);
  };

  const setOfferToMin = () => {
    if (!analysis) return;
    setNewOfferAmount(analysis.suggestedValueMin);
    setEditingOffer(true);
  };

  const setOfferToBestComp = () => {
    if (comparables.length === 0) return;

    // Find best comp (highest cap rate)
    const bestComp = [...comparables].sort((a, b) => (b.capRate || 0) - (a.capRate || 0))[0];

    if (bestComp && bestComp.capRate) {
      setNewOfferAmount(bestComp.salePrice);
      setEditingOffer(true);
      toast({
        title: 'Oferta Baseada no Melhor Comp',
        description: `${bestComp.address} - Cap Rate: ${bestComp.capRate}%`,
      });
    }
  };

  const getBestComp = () => {
    if (comparables.length === 0) return null;
    return [...comparables].sort((a, b) => (b.capRate || 0) - (a.capRate || 0))[0];
  };

  const toggleCompForComparison = (compId: string) => {
    setSelectedCompsForComparison(prev => {
      if (prev.includes(compId)) {
        return prev.filter(id => id !== compId);
      } else if (prev.length < 3) {
        return [...prev, compId];
      } else {
        toast({
          title: 'Limite Atingido',
          description: 'Você pode comparar até 3 propriedades por vez',
          variant: 'destructive',
        });
        return prev;
      }
    });
  };

  const clearComparison = () => {
    setSelectedCompsForComparison([]);
  };

  const toggleSelectAll = () => {
    const filteredComps = getFilteredComparables();
    if (selectedCompsForComparison.length === filteredComps.length && filteredComps.length > 0) {
      // Deselect all
      setSelectedCompsForComparison([]);
    } else {
      // Select all filtered
      setSelectedCompsForComparison(filteredComps.map(c => c.id));
    }
  };

  // Filter and sort comparables
  const getFilteredComparables = () => {
    let filtered = [...comparables];

    // Apply filters
    if (minCapRate > 0) {
      filtered = filtered.filter(c => (c.capRate || 0) >= minCapRate);
    }

    if (filterUnits !== 'all') {
      filtered = filtered.filter(c => c.units?.toString() === filterUnits);
    }

    if (filterCondition !== 'all') {
      filtered = filtered.filter(c => c.condition === filterCondition);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'capRate':
          return (b.capRate || 0) - (a.capRate || 0);
        case 'price':
          return b.salePrice - a.salePrice;
        case 'noi':
          return (b.noi || 0) - (a.noi || 0);
        case 'date':
        default:
          return b.saleDate.getTime() - a.saleDate.getTime();
      }
    });

    return filtered;
  };

  const shareReport = async () => {
    if (!selectedProperty) return;

    const shareData = {
      title: `CMA Report - ${selectedProperty.address}`,
      text: `Comparative Market Analysis for ${selectedProperty.address}\n\nAvg Sale Price: $${analysis?.avgSalePrice.toLocaleString()}\nSuggested Value: $${analysis?.suggestedValueMin.toLocaleString()} - $${analysis?.suggestedValueMax.toLocaleString()}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: 'Compartilhado',
          description: 'Relatório compartilhado com sucesso',
        });
      } else {
        // Fallback: copiar para clipboard
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
        toast({
          title: 'Copiado',
          description: 'Link copiado para a área de transferência',
        });
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível compartilhar',
        variant: 'destructive',
      });
    }
  };

  // Favorites management
  const toggleFavorite = (propertyId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId];
      localStorage.setItem('comps_favorites', JSON.stringify(newFavorites));
      toast({
        title: newFavorites.includes(propertyId) ? '⭐ Added to favorites' : '🗑️ Removed from favorites',
        description: newFavorites.includes(propertyId) ? 'Property bookmarked' : 'Bookmark removed',
      });
      return newFavorites;
    });
  };

  // Smart Insights calculation
  const calculateInsights = () => {
    if (!analysis || comparables.length === 0) return null;

    const avgDaysOnMarket = 12; // Could calculate from data
    const monthTrend = analysis.trendPercentage;
    const yourOffer = selectedProperty?.cash_offer_amount || 0;
    const marketAvg = analysis.avgSalePrice;
    const offerDiff = yourOffer > 0 ? ((yourOffer - marketAvg) / marketAvg) * 100 : 0;

    return {
      marketHeat: monthTrend > 10 ? 'hot' : monthTrend < -5 ? 'cold' : 'stable',
      trend: monthTrend,
      avgDays: avgDaysOnMarket,
      offerVsMarket: offerDiff,
      suggestion: offerDiff < -10 ? `Consider increasing to $${Math.round(marketAvg / 1000)}K` :
                   offerDiff > 10 ? 'Your offer is competitive' :
                   'Your offer is on target'
    };
  };

  const handleRadiusChange = (value: number) => {
    setSearchRadius(value);
    localStorage.setItem('comps_search_radius', value.toString());
    toast({
      title: '✅ Raio atualizado',
      description: `Raio de busca definido para ${value} milha(s)`,
    });
  };

  // Data Quality Banner Component
  const DataQualityBanner = ({ source, count }: { source: string; count: number }) => {
    const qualityConfig = {
      attom: { label: 'MLS Real', color: 'bg-green-500', textColor: 'text-green-700', icon: '✓', bgColor: 'bg-green-50' },
      zillow: { label: 'Zillow API', color: 'bg-blue-500', textColor: 'text-blue-700', icon: '◉', bgColor: 'bg-blue-50' },
      csv: { label: 'Registros Públicos', color: 'bg-yellow-500', textColor: 'text-yellow-700', icon: '◐', bgColor: 'bg-yellow-50' },
      demo: { label: 'Dados Demo', color: 'bg-red-500', textColor: 'text-red-700', icon: '⚠', bgColor: 'bg-red-50' },
    }[source] || { label: 'Desconhecido', color: 'bg-gray-500', textColor: 'text-gray-700', icon: '?', bgColor: 'bg-gray-50' };

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${qualityConfig.bgColor} border border-${qualityConfig.color.replace('bg-', '')}`}>
        <span className={`w-3 h-3 rounded-full ${qualityConfig.color}`}></span>
        <span className={`font-semibold ${qualityConfig.textColor}`}>
          {qualityConfig.icon} {count} comps via {qualityConfig.label}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => window.location.href = '/marketing'}
          className="hover:text-foreground transition"
        >
          Marketing
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Comps Analysis</span>
      </div>

      {/* Simplified Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Home className="w-8 h-8" />
            Comparative Market Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze comparable sales to determine fair market value
          </p>
        </div>

        {/* Main Tabs - Moved to top for better visibility */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'auto' | 'manual' | 'combined')} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="auto" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">API Comps</span>
              <span className="sm:hidden">API</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Manual</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
            <TabsTrigger value="combined" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Combined</span>
              <span className="sm:hidden">Both</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Onboarding Tour */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">👋</span>
              {onboardingStep === 0 && "Welcome to Comps Analysis!"}
              {onboardingStep === 1 && "Select a Property"}
              {onboardingStep === 2 && "Review Comparables"}
              {onboardingStep === 3 && "Save & Export"}
            </DialogTitle>
            <DialogDescription>
              {onboardingStep === 0 && "Let me show you around in 4 quick steps"}
              {onboardingStep === 1 && "Choose any property from the dropdown to start"}
              {onboardingStep === 2 && "Comps load automatically and you can adjust them"}
              {onboardingStep === 3 && "Save to history or export as PDF when done"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`h-1.5 w-8 rounded-full ${i === onboardingStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowOnboarding(false);
                  localStorage.setItem('comps_onboarding_seen', 'true');
                }}
              >
                Skip
              </Button>
              {onboardingStep < 3 ? (
                <Button
                  size="sm"
                  onClick={() => setOnboardingStep(prev => prev + 1)}
                >
                  Next →
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setShowOnboarding(false);
                    localStorage.setItem('comps_onboarding_seen', 'true');
                  }}
                >
                  Get Started!
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Palette */}
      <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
        <DialogContent className="sm:max-w-lg p-0">
          <div className="p-4 border-b">
            <Input
              placeholder="🔍 Search properties, actions... (Cmd+K)"
              className="border-0 focus-visible:ring-0"
              autoFocus
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto p-2">
            <div className="space-y-1">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Quick Actions</p>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setShowCommandPalette(false);
                  if (selectedProperty && analysis) saveReport();
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Analysis
                <kbd className="ml-auto px-2 py-0.5 text-xs border rounded">Ctrl+S</kbd>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setShowCommandPalette(false);
                  if (selectedProperty) exportToPDF(false);
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
                <kbd className="ml-auto px-2 py-0.5 text-xs border rounded">Ctrl+E</kbd>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setShowCommandPalette(false);
                  setShowApiConfig(true);
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                API Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setShowCommandPalette(false);
                  setShowAnalysisHistory(true);
                }}
              >
                <History className="w-4 h-4 mr-2" />
                View History
              </Button>
            </div>
            {properties.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Recent Properties</p>
                {properties.slice(0, 5).map(property => (
                  <Button
                    key={property.id}
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      setSelectedProperty(property);
                      setShowCommandPalette(false);
                    }}
                  >
                    <Home className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{property.address}, {property.city}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Smart Insights Panel */}
      {selectedProperty && analysis && comparables.length > 0 && !loading && (() => {
        const insights = calculateInsights();
        return insights && (
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💡</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 mb-2">Smart Market Insights</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      {insights.marketHeat === 'hot' ? '🔥' : insights.marketHeat === 'cold' ? '❄️' : '📊'}
                      <span>
                        <strong>{insights.marketHeat === 'hot' ? 'Hot' : insights.marketHeat === 'cold' ? 'Cold' : 'Stable'} market:</strong>
                        {' '}{insights.trend > 0 ? '+' : ''}{insights.trend.toFixed(1)}% vs last month
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      ⏱️ <span><strong>Avg time on market:</strong> {insights.avgDays} days</span>
                    </div>
                    {selectedProperty.cash_offer_amount > 0 && (
                      <>
                        <div className="flex items-center gap-2">
                          💰 <span><strong>Your offer:</strong> {insights.offerVsMarket > 0 ? '+' : ''}{insights.offerVsMarket.toFixed(1)}% vs market avg</span>
                        </div>
                        <div className="flex items-center gap-2">
                          💡 <span className="text-purple-700"><strong>{insights.suggestion}</strong></span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Empty State - No Property Selected */}
      {!selectedProperty && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
              <Home className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No Property Selected</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Select a property from the dropdown below to start your comparative market analysis
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setActiveTab('auto')}>
                <Database className="w-4 h-4 mr-2" />
                Browse Properties
              </Button>
              <Dialog open={showApiConfig} onOpenChange={setShowApiConfig}>
                <DialogTrigger asChild>
                  <Button>
                    <Settings className="w-4 h-4 mr-2" />
                    Configure APIs
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Configure Comps APIs</DialogTitle>
                    <DialogDescription>
                      Set up your API keys to get real MLS data
                    </DialogDescription>
                  </DialogHeader>
                  <CompsApiSettings />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Skeleton */}
      {selectedProperty && loading && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 bg-white rounded-lg shadow-sm">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-8 w-32 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Executive Summary with Actions */}
      {selectedProperty && analysis && comparables.length > 0 && !loading && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Resumo Executivo</h3>
                <DataQualityBanner source={dataSource} count={comparables.length} />
              </div>

              {/* Action Buttons - Consolidated */}
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    setLoadingComps(true);
                    await fetchComparables();
                    setLoadingComps(false);
                  }}
                  variant="outline"
                  size="sm"
                  disabled={loadingComps}
                >
                  {loadingComps ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
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
                      <DialogDescription>
                        Add optional notes about this analysis
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="save-notes">Analysis Notes</Label>
                        <Textarea
                          id="save-notes"
                          placeholder="Market conditions, adjustments made, observations..."
                          value={analysisNotes}
                          onChange={(e) => setAnalysisNotes(e.target.value)}
                          rows={4}
                        />
                      </div>
                      {analysis && (
                        <div className="p-3 bg-muted rounded-lg text-sm">
                          <p className="font-semibold mb-1">Summary:</p>
                          <p>Property: {selectedProperty.address}</p>
                          <p>Comps: {comparables.length}</p>
                          <p>Value: ${analysis.suggestedValueMin.toLocaleString()} - ${analysis.suggestedValueMax.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setAnalysisNotes('')}>
                        Clear
                      </Button>
                      <Button onClick={saveReport} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={exportingPDF}>
                      {exportingPDF ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Export
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => exportToPDF(false)} disabled={exportingPDF}>
                      <FileText className="w-4 h-4 mr-2" />
                      Quick PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToPDF(true)} disabled={exportingPDF}>
                      <Download className="w-4 h-4 mr-2" />
                      PDF with Images
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => exportAllFiltered(false)}
                      disabled={exportingPDF || properties.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export All Filtered ({properties.filter(property => {
                        if (offerStatusFilter === 'all') return true;
                        if (offerStatusFilter === 'approved') return property.approval_status === 'approved';
                        if (offerStatusFilter === 'manual') return property.cash_offer_amount > 0 && property.approval_status !== 'approved';
                        if (offerStatusFilter === 'none') return !property.cash_offer_amount || property.cash_offer_amount === 0;
                        return true;
                      }).length})
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={shareReport} variant="outline" size="sm">
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
      )}

      {/* Layout: Summary + History in 2 columns on desktop */}
      {selectedProperty && analysisHistory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Analysis History - Compact sidebar */}
          <Card className="lg:col-span-1 transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Histórico</h3>
                  <Badge variant="secondary" className="text-xs">{analysisHistory.length}</Badge>
                </div>
                <Dialog open={showAnalysisHistory} onOpenChange={setShowAnalysisHistory}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Histórico Completo de Análises</DialogTitle>
                      <DialogDescription>
                        {selectedProperty.address}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {analysisHistory.map((item, index) => (
                        <Card key={item.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <Badge variant={index === 0 ? "default" : "secondary"}>
                                  {index === 0 ? 'Mais Recente' : format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {item.data_source === 'attom' ? 'MLS' : item.data_source === 'zillow' ? 'Zillow' : item.data_source === 'csv' ? 'CSV' : 'Demo'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Valor Mínimo</p>
                                <p className="text-lg font-bold text-blue-600">
                                  ${item.suggested_value_min?.toLocaleString() || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Valor Máximo</p>
                                <p className="text-lg font-bold text-green-600">
                                  ${item.suggested_value_max?.toLocaleString() || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Comps</p>
                                <p className="text-lg font-bold">
                                  {JSON.parse(item.comparables_data || '[]').length}
                                </p>
                              </div>
                            </div>
                            {item.notes && (
                              <div className="p-3 bg-muted rounded-lg mt-3">
                                <p className="text-sm font-semibold mb-1">Notas:</p>
                                <p className="text-sm text-muted-foreground">{item.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {analysisHistory.slice(0, 3).map((item, index) => (
                  <div key={item.id} className="p-3 border rounded-lg bg-white hover:bg-gray-50 transition cursor-pointer" onClick={() => setShowAnalysisHistory(true)}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                        {index === 0 ? 'Current' : formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.data_source === 'attom' ? 'MLS' : item.data_source}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-green-600">
                      ${item.suggested_value_min?.toLocaleString()} - ${item.suggested_value_max?.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {JSON.parse(item.comparables_data || '[]').length} comps
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Content will go here */}
          </div>
        </div>
      )}


      {/* Discovery Banner - Show when using demo data */}
      {dataSource === 'demo' && (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle className="flex items-center gap-2">
            <span>🎭 Você está usando dados demo</span>
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">Configure APIs grátis para obter dados reais de MLS, Zillow e registros públicos</p>
            <div className="flex gap-2">
              <Dialog open={showApiConfig} onOpenChange={setShowApiConfig}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar APIs Agora
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Configurar APIs de Comps</DialogTitle>
                    <DialogDescription>
                      Configure suas chaves de API para obter dados reais de comparáveis
                    </DialogDescription>
                  </DialogHeader>
                  <CompsApiSettings />
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" onClick={() => setActiveTab('manual')}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Ou Use Links Manuais
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search Radius Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <Label className="font-semibold">📍 Raio de Busca:</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={searchRadius}
                  onChange={(e) => handleRadiusChange(parseFloat(e.target.value) || 1)}
                  className="w-24"
                />
                <span className="text-sm font-medium">{searchRadius === 1 ? 'milha' : 'milhas'}</span>
                <span className="text-xs text-muted-foreground">
                  ({(searchRadius * 1.609).toFixed(1)} km)
                </span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                💡 Define a distância máxima para buscar comparáveis próximos à propriedade
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content - Tabs moved to header */}
        <TabsContent value="auto" className="space-y-6">
          {/* Property Selector */}
          <Card>
        <CardHeader>
          <CardTitle>Subject Property</CardTitle>
          <CardDescription>Select a property to analyze</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant={offerStatusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOfferStatusFilter('all')}
            >
              Todas ({properties.length})
            </Button>
            <Button
              variant={offerStatusFilter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOfferStatusFilter('approved')}
              className={offerStatusFilter === 'approved' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              ✓ Aprovadas ({properties.filter(p => p.approval_status === 'approved').length})
            </Button>
            <Button
              variant={offerStatusFilter === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOfferStatusFilter('manual')}
              className={offerStatusFilter === 'manual' ? 'bg-amber-600 hover:bg-amber-700' : ''}
            >
              ✎ Manuais ({properties.filter(p => p.cash_offer_amount > 0 && p.approval_status !== 'approved').length})
            </Button>
            <Button
              variant={offerStatusFilter === 'none' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOfferStatusFilter('none')}
            >
              Sem Oferta ({properties.filter(p => !p.cash_offer_amount || p.cash_offer_amount === 0).length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Filter to show only favorites
                const favProps = properties.filter(p => favorites.includes(p.id));
                if (favProps.length > 0) setSelectedProperty(favProps[0]);
              }}
              className="border-yellow-400"
            >
              ⭐ Favorites ({favorites.length})
            </Button>
          </div>

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
              {properties.filter(property => {
                if (offerStatusFilter === 'all') return true;
                if (offerStatusFilter === 'approved') return property.approval_status === 'approved';
                if (offerStatusFilter === 'manual') return property.cash_offer_amount > 0 && property.approval_status !== 'approved';
                if (offerStatusFilter === 'none') return !property.cash_offer_amount || property.cash_offer_amount === 0;
                return true;
              }).map((property) => {
                const hasOffer = property.cash_offer_amount && property.cash_offer_amount > 0;
                const isApproved = property.approval_status === 'approved';
                const offerValue = `$${Math.round(property.cash_offer_amount / 1000)}K`;

                // Analysis status badge
                const getAnalysisBadge = () => {
                  if (property.analysis_status === 'complete') {
                    return (
                      <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                        ✓ {property.comps_count} comps
                      </Badge>
                    );
                  } else if (property.analysis_status === 'partial') {
                    return (
                      <Badge variant="outline" className="text-amber-700 border-amber-400 text-xs">
                        ~ {property.comps_count} comps
                      </Badge>
                    );
                  } else {
                    return (
                      <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">
                        Pendente
                      </Badge>
                    );
                  }
                };

                return (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(property.id);
                          }}
                          className="flex-shrink-0"
                        >
                          <Star className={`w-4 h-4 ${favorites.includes(property.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                        </button>
                        <span className="flex-1 truncate">{property.address}, {property.city}, {property.state}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {getAnalysisBadge()}
                        {hasOffer ? (
                          isApproved ? (
                            <Badge variant="default" className="bg-blue-600 text-xs">
                              ✓ {offerValue}
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-amber-600 text-xs">
                              ✎ {offerValue}
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline" className="text-gray-500 text-xs">
                            Sem oferta
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Analysis Status Indicator */}
          {selectedProperty && !loading && selectedProperty.last_analysis_date && (
            <div className={`mt-4 p-3 border rounded-lg ${
              selectedProperty.analysis_status === 'complete'
                ? 'bg-green-50 border-green-200'
                : selectedProperty.analysis_status === 'partial'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${
                    selectedProperty.analysis_status === 'complete'
                      ? 'text-green-600'
                      : 'text-amber-600'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      selectedProperty.analysis_status === 'complete'
                        ? 'text-green-900'
                        : 'text-amber-900'
                    }`}>
                      {selectedProperty.analysis_status === 'complete'
                        ? '✓ Análise Completa'
                        : '~ Análise Parcial'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedProperty.comps_count} comparáveis • Última análise: {format(new Date(selectedProperty.last_analysis_date), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && selectedProperty && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">Buscando comparáveis...</p>
                  <p className="text-sm text-blue-700">Analisando propriedades próximas a {selectedProperty.address}</p>
                </div>
              </div>
            </div>
          )}

          {selectedProperty && !loading && (
            <>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{selectedProperty.address}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        const fullAddress = `${selectedProperty.address}, ${selectedProperty.city}, ${selectedProperty.state} ${selectedProperty.zip_code}`;
                        navigator.clipboard.writeText(fullAddress);
                        toast({
                          title: '📋 Copiado!',
                          description: 'Endereço copiado para área de transferência',
                        });
                      }}
                      title="Copiar endereço completo"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
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
                  {selectedProperty.cash_offer_amount > 0 ? (
                    <div className="flex items-center gap-2">
                      {editingOffer ? (
                        <>
                          <Input
                            type="number"
                            value={newOfferAmount}
                            onChange={(e) => setNewOfferAmount(Number(e.target.value))}
                            className="w-32"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updatePropertyOffer(newOfferAmount)}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingOffer(false)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-lg">${selectedProperty.cash_offer_amount.toLocaleString()}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => {
                              setNewOfferAmount(selectedProperty.cash_offer_amount);
                              setEditingOffer(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Editar Oferta
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div>
                      {editingOffer ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={newOfferAmount}
                            onChange={(e) => setNewOfferAmount(Number(e.target.value))}
                            className="w-32"
                            placeholder="Enter offer"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => updatePropertyOffer(newOfferAmount)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Create
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingOffer(false)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          onClick={() => {
                            setNewOfferAmount(analysis?.avgSalePrice || selectedProperty.estimated_value);
                            setEditingOffer(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Offer
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Offer History */}
              {selectedProperty.cash_offer_amount > 0 && offerHistory.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        {offerHistory.length} mudança{offerHistory.length !== 1 ? 's' : ''} de oferta
                      </span>
                    </div>
                    <Dialog open={showOfferHistory} onOpenChange={setShowOfferHistory}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Ver Histórico
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Histórico de Ofertas</DialogTitle>
                          <DialogDescription>
                            {selectedProperty.address}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          {offerHistory.map((item, index) => (
                            <div
                              key={item.id}
                              className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Badge variant={index === 0 ? "default" : "secondary"}>
                                      {index === 0 ? 'Atual' : `#${index + 1}`}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {format(new Date(item.changed_at), 'dd/MM/yyyy HH:mm')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {item.previous_amount !== null && (
                                      <>
                                        <span className="text-lg line-through text-gray-400">
                                          ${item.previous_amount.toLocaleString()}
                                        </span>
                                        <span className="text-muted-foreground">→</span>
                                      </>
                                    )}
                                    <span className="text-xl font-bold text-green-600">
                                      ${item.new_amount.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                {index > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (confirm(`Reverter para oferta de $${item.new_amount.toLocaleString()}?`)) {
                                        updatePropertyOffer(item.new_amount);
                                        setShowOfferHistory(false);
                                      }
                                    }}
                                  >
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Reverter
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Última mudança: {format(new Date(offerHistory[0].changed_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              )}

              {/* Quick Actions for Offer */}
              {analysis && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold">Ações Rápidas para Oferta</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={setOfferToAverage}
                      disabled={editingOffer}
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Média dos Comps (${analysis.avgSalePrice.toLocaleString()})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOfferToPercentage(0.90)}
                      disabled={editingOffer}
                    >
                      <Percent className="w-4 h-4 mr-2" />
                      90% da Média (${Math.round(analysis.avgSalePrice * 0.90).toLocaleString()})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOfferToPercentage(0.85)}
                      disabled={editingOffer}
                    >
                      <Percent className="w-4 h-4 mr-2" />
                      85% da Média (${Math.round(analysis.avgSalePrice * 0.85).toLocaleString()})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={setOfferToMin}
                      disabled={editingOffer}
                    >
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Valor Mínimo (${analysis.suggestedValueMin.toLocaleString()})
                    </Button>
                    {getBestComp() && getBestComp()!.capRate && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={setOfferToBestComp}
                        disabled={editingOffer}
                        className="border-green-500 text-green-700 hover:bg-green-50"
                      >
                        <Star className="w-4 h-4 mr-2 fill-green-500" />
                        Melhor Comp (${getBestComp()!.salePrice.toLocaleString()} - {getBestComp()!.capRate}%)
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Clique para pré-preencher o campo de oferta baseado na análise dos comparáveis
                  </p>
                </div>
              )}

              {/* Analysis Notes */}
              <div className="mt-4">
                <Label htmlFor="analysis-notes" className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Notas da Análise
                </Label>
                <div className="flex gap-2">
                  <Textarea
                    id="analysis-notes"
                    placeholder="Adicione observações sobre a análise, condições da propriedade, ajustes considerados, etc."
                    value={analysisNotes}
                    onChange={(e) => setAnalysisNotes(e.target.value)}
                    rows={3}
                    className="resize-none flex-1"
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!selectedProperty) return;
                        try {
                          // Store notes in property_notes table instead of properties.notes
                          const { error } = await supabase
                            .from('property_notes')
                            .insert({ 
                              property_id: selectedProperty.id,
                              note_text: analysisNotes 
                            });

                          if (error) throw error;

                          toast({
                            title: '✅ Notas Salvas',
                            description: 'Notas da análise foram salvas com sucesso',
                          });
                        } catch (error: any) {
                          toast({
                            title: '❌ Erro',
                            description: error.message,
                            variant: 'destructive',
                          });
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(analysisNotes);
                        toast({
                          title: '📋 Copiado',
                          description: 'Notas copiadas para clipboard',
                        });
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </>
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

          {/* Investment Metrics - only show if available */}
          {analysis.avgCapRate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Cap Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analysis.avgCapRate}%</div>
              </CardContent>
            </Card>
          )}

          {analysis.avgNOI && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg NOI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analysis.avgNOI.toLocaleString()}</div>
              </CardContent>
            </Card>
          )}

          {analysis.avgRentPerUnit && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Rent/Unit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analysis.avgRentPerUnit.toLocaleString()}/mo</div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Bulk Actions Card */}
      {selectedCompsForComparison.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">
                    {selectedCompsForComparison.length} Comparável{selectedCompsForComparison.length > 1 ? 'is' : ''} Selecionado{selectedCompsForComparison.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-blue-700">
                    Ações em massa disponíveis para os comps selecionados
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (!selectedProperty || !analysis) return;
                    const selectedComps = comparables.filter(c => selectedCompsForComparison.includes(c.id));
                    const avgPrice = selectedComps.reduce((sum, c) => sum + c.salePrice, 0) / selectedComps.length;
                    try {
                      setExportingPDF(true);
                      await exportCompsToPDF(selectedProperty, selectedComps, {
                        ...analysis,
                        avgSalePrice: avgPrice,
                      });
                      toast({
                        title: '✅ PDF Gerado',
                        description: `PDF com ${selectedComps.length} comps (Média: $${Math.round(avgPrice).toLocaleString()})`,
                      });
                    } catch (error: any) {
                      toast({
                        title: '❌ Erro ao Exportar',
                        description: error.message,
                        variant: 'destructive',
                      });
                    } finally {
                      setExportingPDF(false);
                    }
                  }}
                  disabled={exportingPDF}
                  className="bg-white"
                >
                  {exportingPDF ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Exportar PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const selectedComps = comparables.filter(c => selectedCompsForComparison.includes(c.id));
                    const avgPrice = selectedComps.reduce((sum, c) => sum + c.salePrice, 0) / selectedComps.length;
                    setNewOfferAmount(Math.round(avgPrice));
                    setEditingOffer(true);
                    toast({
                      title: '💡 Oferta Sugerida',
                      description: `Média dos ${selectedComps.length} comps: $${Math.round(avgPrice).toLocaleString()}`,
                    });
                  }}
                  className="bg-white"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Usar Média como Oferta
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedCompsForComparison([])}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Seleção
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Side-by-Side Comparison */}
      {selectedProperty && selectedCompsForComparison.length > 0 && (
        <CompsComparison
          subjectProperty={{
            id: selectedProperty.id,
            address: selectedProperty.address,
            estimatedValue: selectedProperty.estimated_value,
            sqft: 0, // Would need to add to properties table
            beds: 0,
            baths: 0,
          }}
          selectedComps={comparables
            .filter(comp => selectedCompsForComparison.includes(comp.id))
            .map(comp => ({
              id: comp.id,
              address: comp.address,
              salePrice: comp.salePrice,
              saleDate: comp.saleDate,
              sqft: comp.sqft,
              beds: comp.beds,
              baths: comp.baths,
              yearBuilt: comp.yearBuilt,
              units: comp.units,
              totalRent: comp.totalRent,
              rentPerUnit: comp.rentPerUnit,
              noi: comp.noi,
              capRate: comp.capRate,
              condition: comp.condition,
              distanceMiles: comp.distanceMiles,
              pricePerSqft: comp.pricePerSqft,
            }))}
          onRemoveComp={(compId) => toggleCompForComparison(compId)}
          onClear={clearComparison}
        />
      )}

      {/* Map View */}
      {selectedProperty && comparables.length > 0 && (
        <CompsMapboxMap
          subjectProperty={{
            address: selectedProperty.address,
            city: selectedProperty.city,
            state: selectedProperty.state,
            zip_code: selectedProperty.zip_code,
          }}
          comparables={comparables.map(comp => ({
            ...comp,
            isBest: getBestComp()?.id === comp.id,
          }))}
          onCompClick={(comp) => {
            toast({
              title: comp.address,
              description: `$${comp.salePrice.toLocaleString()} • ${comp.capRate ? comp.capRate + '% Cap Rate' : 'N/A'}`,
            });
          }}
        />
      )}

      {/* Professional Comparison Grid */}
      {selectedProperty && comparables.length > 0 && (
        <CompsComparisonGrid
          subjectProperty={{
            address: selectedProperty.address,
            estimatedValue: selectedProperty.estimated_value,
            beds: 3, // Default values - could be fetched from property data
            baths: 2,
            sqft: comparables[0]?.sqft || 1500,
            yearBuilt: comparables[0]?.yearBuilt || 2000,
            lotSize: comparables[0]?.lotSize,
          }}
          comparables={comparables.slice(0, 5).map(comp => ({
            id: comp.id,
            address: comp.address,
            salePrice: comp.salePrice,
            saleDate: comp.saleDate.toISOString(),
            beds: comp.beds,
            baths: comp.baths,
            sqft: comp.sqft,
            yearBuilt: comp.yearBuilt,
            lotSize: comp.lotSize,
            isBest: getBestComp()?.id === comp.id,
            distance: comp.distanceMiles,
          }))}
          onAdjustmentChange={(compId, adjustments) => {
            console.log(`Adjustments for ${compId}:`, adjustments);
            // Could save adjustments to database or update local state
          }}
        />
      )}

      {/* Comparable Properties Table */}
      {comparables.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comparable Sales</CardTitle>
                <CardDescription>
                  Recent sales within 1 mile of subject property ({getFilteredComparables().length} of {comparables.length} shown)
                </CardDescription>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Sale Date</SelectItem>
                    <SelectItem value="capRate">Cap Rate</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="noi">NOI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-3 mt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Min Cap Rate:</Label>
                <Input
                  type="number"
                  value={minCapRate || ''}
                  onChange={(e) => setMinCapRate(Number(e.target.value))}
                  className="w-20 h-8"
                  placeholder="0%"
                  step="0.5"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Units:</Label>
                <Select value={filterUnits} onValueChange={setFilterUnits}>
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="1">1 unit</SelectItem>
                    <SelectItem value="2">2 units</SelectItem>
                    <SelectItem value="3">3 units</SelectItem>
                    <SelectItem value="4">4 units</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Condição:</Label>
                <Select value={filterCondition} onValueChange={setFilterCondition}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="reformed">Reformada</SelectItem>
                    <SelectItem value="good">Boa</SelectItem>
                    <SelectItem value="needs_work">Precisa Reforma</SelectItem>
                    <SelectItem value="as-is">As-is</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(minCapRate > 0 || filterUnits !== 'all' || filterCondition !== 'all') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setMinCapRate(0);
                    setFilterUnits('all');
                    setFilterCondition('all');
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}

              <div className="ml-auto flex items-center gap-2">
                {/* Export Selected Comps */}
                {selectedCompsForComparison.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {selectedCompsForComparison.length} selecionado{selectedCompsForComparison.length > 1 ? 's' : ''}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!selectedProperty || !analysis) return;
                        const selectedComps = comparables.filter(c => selectedCompsForComparison.includes(c.id));
                        try {
                          setExportingPDF(true);
                          await exportCompsToPDF(selectedProperty, selectedComps, {
                            ...analysis,
                            avgSalePrice: selectedComps.reduce((sum, c) => sum + c.salePrice, 0) / selectedComps.length,
                          });
                          toast({
                            title: '✅ PDF Exportado',
                            description: `PDF com ${selectedComps.length} comps selecionados`,
                          });
                        } catch (error: any) {
                          toast({
                            title: '❌ Erro',
                            description: error.message,
                            variant: 'destructive',
                          });
                        } finally {
                          setExportingPDF(false);
                        }
                      }}
                      disabled={exportingPDF}
                    >
                      {exportingPDF ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Exportar Selecionados
                    </Button>
                  </div>
                )}
                <Button
                  size="sm"
                  variant={selectedCompsForComparison.length === getFilteredComparables().length && getFilteredComparables().length > 0 ? "default" : "outline"}
                  onClick={toggleSelectAll}
                  disabled={getFilteredComparables().length === 0}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {selectedCompsForComparison.length === getFilteredComparables().length && getFilteredComparables().length > 0
                    ? `Desmarcar (${selectedCompsForComparison.length})`
                    : `Selecionar (${getFilteredComparables().length})`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Compare</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Sale Date</TableHead>
                    <TableHead className="text-right">Price/Unit</TableHead>
                    <TableHead className="text-right">Sqft</TableHead>
                    <TableHead className="text-right">$/Sqft</TableHead>
                    <TableHead>Beds/Ba</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Rent/Unit</TableHead>
                    <TableHead className="text-right">NOI</TableHead>
                    <TableHead className="text-right">Cap Rate</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Adjusted $</TableHead>
                    <TableHead className="w-20">Adjust</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredComparables().map((comp) => {
                    const isBest = getBestComp()?.id === comp.id;
                    const isSelected = selectedCompsForComparison.includes(comp.id);
                    return (
                    <TableRow
                      key={comp.id}
                      className={`${isBest ? 'bg-green-50 border-l-4 border-l-green-500' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCompForComparison(comp.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        {comp.qualityScore !== undefined && (
                          <div className="flex flex-col gap-1">
                            <Badge className={`${getScoreBadge(comp.qualityScore).color} ${getScoreBadge(comp.qualityScore).textColor} text-xs justify-center`}>
                              {getScoreBadge(comp.qualityScore).label}
                            </Badge>
                            <div className="text-xs font-bold text-center">
                              {comp.qualityScore.toFixed(1)}/10
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isBest && <Star className="w-4 h-4 text-green-500 fill-green-500" />}
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
                      <TableCell className="text-right font-semibold">
                        ${comp.units ? Math.round(comp.salePrice / comp.units).toLocaleString() : comp.salePrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {comp.sqft.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${comp.pricePerSqft}
                      </TableCell>
                      <TableCell>
                        {comp.beds}/{comp.baths}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {comp.units || 1}
                      </TableCell>
                      <TableCell className="text-right text-green-700">
                        ${comp.rentPerUnit?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${comp.noi?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={comp.capRate && comp.capRate > 6 ? "default" : "secondary"}>
                          {comp.capRate ? `${comp.capRate}%` : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            comp.condition === 'reformed' ? 'default' :
                            comp.condition === 'good' ? 'secondary' :
                            comp.condition === 'needs_work' ? 'outline' : 'destructive'
                          }
                        >
                          {comp.condition === 'reformed' ? 'Reformada' :
                           comp.condition === 'good' ? 'Boa' :
                           comp.condition === 'needs_work' ? 'Precisa Reforma' : 'As-is'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {comp.adjustedPrice ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-green-600">
                              ${comp.adjustedPrice.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {((comp.adjustedPrice - comp.salePrice) / comp.salePrice * 100).toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          title="Coming soon: Adjust comp value based on condition, amenities, etc."
                        >
                          <Calculator className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )})}

                  {getFilteredComparables().length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        Nenhum comp corresponde aos filtros selecionados
                      </TableCell>
                    </TableRow>
                  )}
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
      </TabsContent>

      {/* Manual Comps Tab */}
      <TabsContent value="manual" className="mt-6">
        <ManualCompsManager
          preSelectedPropertyId={selectedProperty?.id}
          onLinkAdded={() => {
            if (selectedProperty) {
              loadManualLinksCount(selectedProperty.id);
            }
          }}
        />
      </TabsContent>

      {/* Combined View Tab */}
      <TabsContent value="combined" className="space-y-6 mt-6">
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Combined Analysis View
            </CardTitle>
            <CardDescription>
              Visualize API Comps and Manual Links together for comprehensive market analysis
            </CardDescription>
          </CardHeader>
        </Card>

        {!selectedProperty ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calculator className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Property Selected</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Select a property from the Auto tab to view combined analysis
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Combined Stats Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Data Sources Summary</CardTitle>
                <CardDescription>Overview of all available comparable data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">API Comps</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{comparables.length}</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Source: {dataSource === 'demo' ? 'Demo Data' : 'Live API'}
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon className="w-5 h-5 text-amber-600" />
                      <h4 className="font-semibold text-amber-900">Manual Links</h4>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                      {manualLinksCount}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">Saved external links</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">Total Sources</h4>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {comparables.length + manualLinksCount}
                    </p>
                    <p className="text-xs text-purple-700 mt-1">Combined data points</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Comps Section */}
            {comparables.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        API-Sourced Comparables ({comparables.length})
                      </CardTitle>
                      <CardDescription>
                        Automated comparable sales from MLS/API data
                      </CardDescription>
                    </div>
                    <Badge className="bg-blue-600 text-white">
                      {dataSource === 'demo' ? '🎭 Demo' : '✓ Live'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quality</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Sale Date</TableHead>
                          <TableHead className="text-right">Sale Price</TableHead>
                          <TableHead className="text-right">Sqft</TableHead>
                          <TableHead className="text-right">$/Sqft</TableHead>
                          <TableHead>Beds/Ba</TableHead>
                          <TableHead className="text-right">Distance</TableHead>
                          <TableHead className="text-right">Cap Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparables.slice(0, 5).map((comp) => (
                          <TableRow key={comp.id}>
                            <TableCell>
                              {comp.qualityScore !== undefined && (
                                <div className="flex flex-col gap-1">
                                  <Badge className={`${getScoreBadge(comp.qualityScore).color} ${getScoreBadge(comp.qualityScore).textColor} text-xs justify-center`}>
                                    {getScoreBadge(comp.qualityScore).label}
                                  </Badge>
                                  <div className="text-xs font-bold text-center">
                                    {comp.qualityScore.toFixed(1)}/10
                                  </div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                {comp.address}
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(comp.saleDate, 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ${comp.salePrice.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {comp.sqft.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${comp.pricePerSqft}
                            </TableCell>
                            <TableCell>
                              {comp.beds}/{comp.baths}
                            </TableCell>
                            <TableCell className="text-right">
                              {comp.distanceMiles.toFixed(2)} mi
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={comp.capRate && comp.capRate > 6 ? "default" : "secondary"}>
                                {comp.capRate ? `${comp.capRate}%` : '-'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manual Comps Section - Show saved links */}
            {manualComps.length > 0 && (
              <Card className="border-amber-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-amber-600" />
                        Manual Comp Links ({manualComps.length})
                      </CardTitle>
                      <CardDescription>
                        External links you've saved for comparison
                      </CardDescription>
                    </div>
                    <Badge className="bg-amber-600 text-white">
                      📎 Manual
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {manualComps.map((comp) => (
                      <div key={comp.id} className="p-4 border border-amber-200 rounded-lg bg-amber-50 hover:bg-amber-100 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-amber-600 text-white text-xs">Manual</Badge>
                              <span className="text-sm font-medium">{comp.source || 'External Link'}</span>
                            </div>
                            <a
                              href={comp.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm break-all"
                            >
                              {comp.url}
                            </a>
                            {comp.notes && (
                              <p className="text-sm text-muted-foreground mt-2">{comp.notes}</p>
                            )}
                            {comp.estimated_price && (
                              <div className="mt-2">
                                <span className="text-sm text-muted-foreground">Estimated Price: </span>
                                <span className="text-sm font-semibold text-green-600">
                                  ${comp.estimated_price.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <a href={comp.url} target="_blank" rel="noopener noreferrer">
                              <LinkIcon className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manual Links Manager */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-600" />
                  Add Manual Comp Links
                </CardTitle>
                <CardDescription>
                  Add external links to Zillow, Trulia, Redfin, etc.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ManualCompsManager
                  preSelectedPropertyId={selectedProperty?.id}
                  onLinkAdded={() => {
                    if (selectedProperty) {
                      loadManualLinksCount(selectedProperty.id);
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Combined Analysis Summary */}
            {analysis && (
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-purple-600" />
                    Combined Analysis Summary
                  </CardTitle>
                  <CardDescription>
                    Market analysis based on API comparables
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Avg Sale Price</p>
                      <p className="text-2xl font-bold">${analysis.avgSalePrice.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Price Range</p>
                      <p className="text-lg font-bold">
                        ${analysis.suggestedValueMin.toLocaleString()} - ${analysis.suggestedValueMax.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Market Trend</p>
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
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1 text-purple-900">Combined View Benefits</p>
                        <ul className="text-purple-800 space-y-1">
                          <li>• API Comps provide structured data with metrics (Cap Rate, NOI, etc.)</li>
                          <li>• Manual Links allow you to reference specific listings on major platforms</li>
                          <li>• Use both sources to validate your analysis and build comprehensive reports</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setActiveTab('auto')}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Database className="w-4 h-4 mr-2" />
                  View API Comps Tab
                </Button>
                <Button
                  onClick={() => setActiveTab('manual')}
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Add Manual Links
                </Button>
                <Button
                  onClick={() => exportToPDF(true)}
                  disabled={!selectedProperty || exportingPDF}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {exportingPDF ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export Combined Report
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>
    </Tabs>
    </div>
  );
};

export default CompsAnalysis;
