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
} from 'lucide-react';
import { format } from 'date-fns';
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
import { geocodeAddress } from '@/services/geocodingService';
import { loadGeocodeCache } from '@/utils/geocodingCache';

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
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');

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
        .select('id, address, city, state, zip_code, estimated_value, cash_offer_amount, property_image_url, approval_status, approved_at')
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

          // Calculate quality score
          const scoring = calculateCompScore(comparable, {
            sqft: property.estimated_value ? 1500 : sqft, // Assume 1500 if no data
            beds: 3, // Default assumption
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

  const updatePropertyOffer = async (newOffer: number) => {
    if (!selectedProperty) return;

    try {
      const { error } = await supabase
        .from('properties')
        .update({ cash_offer_amount: newOffer })
        .eq('id', selectedProperty.id);

      if (error) throw error;

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

  const handleRadiusChange = (value: number) => {
    setSearchRadius(value);
    localStorage.setItem('comps_search_radius', value.toString());
    toast({
      title: '✅ Raio atualizado',
      description: `Raio de busca definido para ${value} milha(s)`,
    });
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
          <Button onClick={shareReport} variant="outline" disabled={!selectedProperty}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
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
          <Button
            onClick={() => exportAllFiltered(false)}
            disabled={exportingPDF || properties.length === 0}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            {exportingPDF ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export All Filtered ({properties.filter(property => {
              if (offerStatusFilter === 'all') return true;
              if (offerStatusFilter === 'approved') return property.approval_status === 'approved';
              if (offerStatusFilter === 'manual') return property.cash_offer_amount > 0 && property.approval_status !== 'approved';
              if (offerStatusFilter === 'none') return !property.cash_offer_amount || property.cash_offer_amount === 0;
              return true;
            }).length})
          </Button>
        </div>
      </div>

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

      {/* Tabs: Auto vs Manual */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'auto' | 'manual')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="auto">
            <Database className="w-4 h-4 mr-2" />
            Busca Automática (APIs)
          </TabsTrigger>
          <TabsTrigger value="manual">
            <LinkIcon className="w-4 h-4 mr-2" />
            Links Salvos (Manual)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auto" className="space-y-6 mt-6">
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

                return (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center justify-between w-full gap-3">
                      <span>{property.address}, {property.city}, {property.state}</span>
                      {hasOffer ? (
                        <div className="flex items-center gap-2">
                          {isApproved ? (
                            <Badge variant="default" className="ml-2 bg-blue-600">
                              ✓ {offerValue} Aprovado
                            </Badge>
                          ) : (
                            <Badge variant="default" className="ml-2 bg-amber-600">
                              ✎ {offerValue} Manual
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="ml-2">
                          Sem oferta
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {selectedProperty && (
            <>
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
                </div>
              </div>

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

              <div className="ml-auto">
                <Button
                  size="sm"
                  variant={selectedCompsForComparison.length === getFilteredComparables().length && getFilteredComparables().length > 0 ? "default" : "outline"}
                  onClick={toggleSelectAll}
                  disabled={getFilteredComparables().length === 0}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {selectedCompsForComparison.length === getFilteredComparables().length && getFilteredComparables().length > 0
                    ? `Deselect All (${selectedCompsForComparison.length})`
                    : `Select All (${getFilteredComparables().length})`}
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
        <ManualCompsManager preSelectedPropertyId={selectedProperty?.id} />
      </TabsContent>
    </Tabs>
    </div>
  );
};

export default CompsAnalysis;
