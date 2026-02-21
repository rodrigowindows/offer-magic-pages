import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  Target,
  Keyboard,
  TrendingUp,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Undo2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart3,
  SkipForward,
  Settings2,
  Eye,
  EyeOff,
} from "lucide-react";
import { PropertyImageDisplay } from "./PropertyImageDisplay";
import { EmptyState } from "./EmptyState";
import { CompsModal } from "./process/CompsModal";

// Razões predefinidas para rejeição
const REJECTION_REASONS = [
  { value: "new-construction", label: "Casa Nova (menos de 20 anos)" },
  { value: "recent-sale", label: "Recém Vendida (menos de 2 anos)" },
  { value: "too-good-condition", label: "Casa em Bom Estado" },
  { value: "multi-family", label: "Multi-Family" },
  { value: "hoa-restrictions", label: "Propriedade com HOA" },
  { value: "land", label: "Terreno (Land)" },
  { value: "no-equity", label: "Low-Equity" },
  { value: "agent-listed", label: "Anunciada por Corretor" },
  { value: "commercial", label: "Imóvel Comercial" },
  { value: "duplicate", label: "Duplicado" },
  { value: "wrong-location", label: "Localização errada" },
  { value: "other", label: "Outro motivo" },
];

// Configurable detail fields with fill-rate awareness
interface DetailField {
  key: string;
  label: string;
  category: 'decisao' | 'imovel' | 'dono' | 'financeiro';
  format: (prop: QueueProperty) => string | null; // returns null if no data
  highlight?: (prop: QueueProperty) => boolean;
  defaultVisible?: boolean;
}

const DETAIL_FIELDS: DetailField[] = [
  // Decisão
  { key: 'tier', label: 'Tier', category: 'decisao', defaultVisible: true,
    format: (p) => {
      if (!p.evaluation) return null;
      const tier = p.evaluation.match(/Tier:(\S+)/)?.[1] || '';
      const visual = p.evaluation.match(/Visual:(\S+)/)?.[1] || '';
      const cond = p.evaluation.match(/Cond:(\d+)/)?.[1] || '';
      return `${tier.replace(/^\d+-/, '').replace(/_/g, ' ')}${visual ? ` (${visual})` : ''}${cond ? ` Cond:${cond}` : ''}`;
    },
    highlight: (p) => !!p.evaluation?.includes('1-CALL_NOW') || !!p.evaluation?.includes('Visual:HOT'),
  },
  { key: 'lead_score', label: 'Lead Score', category: 'decisao', defaultVisible: true,
    format: (p) => p.lead_score ? String(p.lead_score) : null,
    highlight: (p) => (p.lead_score ?? 0) >= 230,
  },
  { key: 'tags', label: 'Tags', category: 'decisao', defaultVisible: false,
    format: (p) => {
      const t = p.tags;
      if (Array.isArray(t) && t.length) return t.join(', ');
      if (typeof t === 'string' && t !== '[]' && t) return t;
      return null;
    },
  },
  { key: 'focar', label: 'Focar', category: 'decisao', defaultVisible: true,
    format: (p) => p.focar || null,
    highlight: (p) => p.focar === 'SIM',
  },
  // Financeiro
  { key: 'estimated_value', label: 'Valor Estimado', category: 'financeiro', defaultVisible: true,
    format: (p) => p.estimated_value ? `$${p.estimated_value.toLocaleString()}` : null,
  },
  { key: 'cash_offer_amount', label: 'Oferta', category: 'financeiro', defaultVisible: true,
    format: (p) => p.cash_offer_amount ? `$${p.cash_offer_amount.toLocaleString()}` : null,
  },
  // Imóvel
  { key: 'year_built', label: 'Ano Construção', category: 'imovel', defaultVisible: true,
    format: (p) => p.year_built ? String(p.year_built) : null,
  },
  { key: 'bedrooms', label: 'Quartos', category: 'imovel', defaultVisible: true,
    format: (p) => p.bedrooms ? String(p.bedrooms) : null,
  },
  { key: 'bathrooms', label: 'Banheiros', category: 'imovel', defaultVisible: true,
    format: (p) => p.bathrooms ? String(p.bathrooms) : null,
  },
  { key: 'lot_size', label: 'Lote', category: 'imovel', defaultVisible: true,
    format: (p) => {
      if (!p.lot_size) return null;
      const v = Number(p.lot_size);
      return v >= 1 ? `${v.toFixed(1)} acres` : `${(v * 43560).toFixed(0)} sqft`;
    },
  },
  { key: 'square_feet', label: 'Área (sqft)', category: 'imovel', defaultVisible: true,
    format: (p) => p.square_feet ? p.square_feet.toLocaleString() : null,
  },
  { key: 'property_type', label: 'Tipo', category: 'imovel', defaultVisible: true,
    format: (p) => p.property_type || null,
  },
  { key: 'neighborhood', label: 'Bairro', category: 'imovel', defaultVisible: false,
    format: (p) => p.neighborhood || null,
  },
  { key: 'zip_code', label: 'CEP', category: 'imovel', defaultVisible: false,
    format: (p) => p.zip_code || null,
  },
  // Dono
  { key: 'owner_name', label: 'Proprietário', category: 'dono', defaultVisible: true,
    format: (p) => p.owner_name || null,
  },
  { key: 'owner_address', label: 'End. Dono', category: 'dono', defaultVisible: true,
    format: (p) => p.owner_address || null,
  },
  { key: 'owner_phone', label: 'Telefone', category: 'dono', defaultVisible: true,
    format: (p) => p.owner_phone || null,
  },
  { key: 'origem', label: 'Parcel ID', category: 'dono', defaultVisible: false,
    format: (p) => p.origem || null,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  decisao: 'Decisão',
  financeiro: 'Financeiro',
  imovel: 'Imóvel',
  dono: 'Proprietário',
};

const STORAGE_KEY = 'review-queue-visible-fields-v2';

const loadVisibleFields = (): Set<string> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch {}
  return new Set(DETAIL_FIELDS.filter(f => f.defaultVisible).map(f => f.key));
};

const saveVisibleFields = (fields: Set<string>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...fields]));
};

// Compute fill rates from loaded properties
const computeFillRates = (props: QueueProperty[]): Map<string, number> => {
  const rates = new Map<string, number>();
  if (props.length === 0) return rates;
  for (const field of DETAIL_FIELDS) {
    const filled = props.filter(p => field.format(p) !== null).length;
    rates.set(field.key, Math.round((filled / props.length) * 100));
  }
  return rates;
};

interface QueueProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  neighborhood: string | null;
  owner_name: string;
  property_image_url: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  approval_status: string | null;
  property_type: string | null;
  year_built: number | null;
  square_feet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lot_size: number | null;
  owner_phone: string | null;
  lead_score: number | null;
  zillow_url: string | null;
  focar: string | null;
  // New fields from Orlando batch analysis
  evaluation: string | null;
  tags: string[] | string | null;
  owner_address: string | null;
  origem: string | null;
}

// Pre-denial rules
interface PreDenialSuggestion {
  reason: string;
  label: string;
}

const getPreDenialSuggestions = (prop: QueueProperty): PreDenialSuggestion[] => {
  const suggestions: PreDenialSuggestion[] = [];
  const currentYear = new Date().getFullYear();

  // Casa nova (menos de 20 anos)
  if (prop.year_built && (currentYear - prop.year_built) < 20) {
    suggestions.push({ reason: 'new-construction', label: `Casa Nova (${prop.year_built})` });
  }

  // Multi-Family
  if (prop.property_type?.toLowerCase().includes('multi')) {
    suggestions.push({ reason: 'multi-family', label: 'Multi-Family' });
  }

  // Land (from property_type or tags/evaluation)
  const tagsStr = Array.isArray(prop.tags) ? prop.tags.join(',') : (prop.tags || '');
  if (prop.property_type?.toLowerCase() === 'land' || prop.property_type?.toLowerCase() === 'vacant land' || tagsStr.includes('LAND')) {
    suggestions.push({ reason: 'land', label: 'Terreno (Land)' });
  }

  // Commercial
  if (prop.property_type?.toLowerCase().includes('commercial') || prop.property_type?.toLowerCase().includes('comercial')) {
    suggestions.push({ reason: 'commercial', label: 'Imóvel Comercial' });
  }

  return suggestions;
};

interface DailyStats {
  reviewed_today: number;
  approved_today: number;
  rejected_today: number;
  total_pending: number;
  user_rank: number;
  total_users: number;
}

// Extract Visual category from evaluation string
const getVisualCategory = (evaluation: string | null): string | null => {
  const m = evaluation?.match(/Visual:(\S+)/);
  return m ? m[1] : null;
};

const VISUAL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  HOT: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  WARM: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  COLD: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  LAND: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-300' },
};

interface ReviewQueueProps {
  selectedBatch?: string;
}

export const ReviewQueue = ({ selectedBatch }: ReviewQueueProps) => {
  const [properties, setProperties] = useState<QueueProperty[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  // Filters
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [visualFilter, setVisualFilter] = useState<string>('all');
  const [statusCounts, setStatusCounts] = useState<{ pending: number; approved: number; rejected: number }>({ pending: 0, approved: 0, rejected: 0 });
  const [visibleFields, setVisibleFields] = useState<Set<string>>(loadVisibleFields);
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [fillRates, setFillRates] = useState<Map<string, number>>(new Map());
  // Inline rejection state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  // Quick offer amount
  const [quickOfferAmount, setQuickOfferAmount] = useState("");
  // Approve flow phases: null → 'choose' → 'comps' → 'offer' → save → advance
  type ApprovePhase = 'choose' | 'comps' | 'offer' | null;
  const [approvePhase, setApprovePhase] = useState<ApprovePhase>(null);
  const [pendingApproveProperty, setPendingApproveProperty] = useState<QueueProperty | null>(null);
  const [compsModalProperty, setCompsModalProperty] = useState<QueueProperty | null>(null);
  const [compsARV, setCompsARV] = useState<number | null>(null);
  const { user, userId, userName } = useCurrentUser();
  const { toast } = useToast();

  // Filter properties by Visual category (client-side)
  const visualCounts = properties.reduce((acc, p) => {
    const v = getVisualCategory(p.evaluation);
    if (v) acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredProperties = visualFilter === 'all'
    ? properties
    : properties.filter(p => getVisualCategory(p.evaluation) === visualFilter);

  const currentProperty = filteredProperties[currentIndex];
  const progress = filteredProperties.length > 0 ? ((currentIndex + 1) / filteredProperties.length) * 100 : 0;

  const toggleField = (key: string) => {
    setVisibleFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveVisibleFields(next);
      return next;
    });
  };

  useEffect(() => {
    fetchProperties();
    if (user) {
      fetchDailyStats();
      fetchStatusCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedBatch, statusFilter]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [visualFilter, statusFilter]);

  // Compute fill rates when properties load
  useEffect(() => {
    if (properties.length > 0) {
      setFillRates(computeFillRates(properties));
    }
  }, [properties]);

  // Reset forms when changing property
  useEffect(() => {
    setShowRejectForm(false);
    setSelectedReason("");
    setRejectionNotes("");
    setApprovePhase(null);
    setPendingApproveProperty(null);
    setQuickOfferAmount("");
    setCompsARV(null);
  }, [currentIndex]);

  // Keyboard shortcuts: A = approve, R = reject, C = comps, N = next, Enter = confirm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isProcessing) return;

      // Phase: choose (C = comps, N = skip comps)
      if (approvePhase === 'choose') {
        switch (e.key) {
          case 'c':
          case 'C':
            e.preventDefault();
            handleOpenComps();
            return;
          case 'n':
          case 'N':
          case 'ArrowRight':
            e.preventDefault();
            handleSkipComps();
            return;
          case 'Escape':
            e.preventDefault();
            handleCancelApprove();
            return;
        }
        return;
      }

      // Phase: offer (Enter = confirm, Esc = cancel)
      // Note: input fields are handled by the early return above
      if (approvePhase === 'offer') {
        return; // Let the input handle keys
      }

      if (!currentProperty) return;

      switch (e.key) {
        case 'a':
        case 'A':
          if (!showRejectForm) {
            e.preventDefault();
            handleStartApprove();
          }
          break;
        case 'r':
        case 'R':
          if (!approvePhase) {
            e.preventDefault();
            setShowRejectForm(true);
          }
          break;
        case 'ArrowRight':
          if (!showRejectForm && !approvePhase) {
            e.preventDefault();
            handleNext();
          }
          break;
        case 'ArrowLeft':
          if (!showRejectForm && !approvePhase) {
            e.preventDefault();
            handlePrevious();
          }
          break;
        case 'Escape':
          if (showRejectForm) {
            e.preventDefault();
            setShowRejectForm(false);
            setSelectedReason("");
            setRejectionNotes("");
          }
          break;
        case 'Enter':
          if (showRejectForm && selectedReason) {
            e.preventDefault();
            handleReject();
          }
          break;
        default:
          if (showRejectForm && e.key >= '1' && e.key <= '9') {
            const index = parseInt(e.key) - 1;
            if (index < REJECTION_REASONS.length) {
              e.preventDefault();
              setSelectedReason(REJECTION_REASONS[index].value);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, properties.length, currentProperty, showRejectForm, selectedReason, isProcessing, approvePhase]);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("properties")
        .select("id, address, city, state, zip_code, neighborhood, owner_name, property_image_url, estimated_value, cash_offer_amount, approval_status, property_type, year_built, square_feet, bedrooms, bathrooms, lot_size, owner_phone, lead_score, zillow_url, focar, evaluation, tags, owner_address, origem")
        .order("created_at", { ascending: true })
        .limit(500);

      // Filter by status
      if (statusFilter === 'pending') {
        query = query.or("approval_status.is.null,approval_status.eq.pending");
      } else {
        query = query.eq("approval_status", statusFilter);
      }

      if (selectedBatch && selectedBatch !== 'all') {
        query = query.eq('import_batch', selectedBatch);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProperties((data as unknown as QueueProperty[]) || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const batchFilter = selectedBatch && selectedBatch !== 'all' ? selectedBatch : null;

      let pQ = supabase.from("properties").select("*", { count: "exact", head: true })
        .or("approval_status.is.null,approval_status.eq.pending");
      let aQ = supabase.from("properties").select("*", { count: "exact", head: true })
        .eq("approval_status", "approved");
      let rQ = supabase.from("properties").select("*", { count: "exact", head: true })
        .eq("approval_status", "rejected");

      if (batchFilter) {
        pQ = pQ.eq('import_batch', batchFilter);
        aQ = aQ.eq('import_batch', batchFilter);
        rQ = rQ.eq('import_batch', batchFilter);
      }

      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([pQ, aQ, rQ]);

      setStatusCounts({
        pending: pendingRes.count || 0,
        approved: approvedRes.count || 0,
        rejected: rejectedRes.count || 0,
      });
    } catch (err) {
      console.error('Error fetching status counts:', err);
    }
  };

  const fetchDailyStats = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's reviews by current user
      const { data: userReviews, error: userError } = await supabase
        .from("properties")
        .select("approval_status")
        .eq("approved_by", user.id)
        .gte("approved_at", today.toISOString());

      if (userError) throw userError;

      const reviewed_today = userReviews?.length || 0;
      const approved_today = userReviews?.filter(p => p.approval_status === "approved").length || 0;
      const rejected_today = userReviews?.filter(p => p.approval_status === "rejected").length || 0;

      // Get total pending (filtered by batch if selected)
      let pendingQuery = supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .or("approval_status.is.null,approval_status.eq.pending");

      if (selectedBatch && selectedBatch !== 'all') {
        pendingQuery = pendingQuery.eq('import_batch', selectedBatch);
      }

      const { count: totalPending, error: countError } = await pendingQuery;

      if (countError) throw countError;

      // Get all users' stats for ranking
      const { data: allUsers, error: rankError } = await supabase
        .from("properties")
        .select("approved_by")
        .not("approved_by", "is", null)
        .gte("approved_at", today.toISOString());

      if (rankError) throw rankError;

      // Calculate user counts
      const userCounts = new Map<string, number>();
      allUsers?.forEach(p => {
        const count = userCounts.get(p.approved_by) || 0;
        userCounts.set(p.approved_by, count + 1);
      });

      const sortedUsers = Array.from(userCounts.entries())
        .sort((a, b) => b[1] - a[1]);

      const userRank = sortedUsers.findIndex(([userId]) => userId === user.id) + 1;

      setDailyStats({
        reviewed_today,
        approved_today,
        rejected_today,
        total_pending: totalPending || 0,
        user_rank: userRank || sortedUsers.length + 1,
        total_users: sortedUsers.length,
      });
    } catch (error: any) {
      console.error("Error fetching daily stats:", error);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredProperties.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast({
        title: "Fim da lista",
        description: "Você chegou ao final das propriedades filtradas.",
      });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const advanceAfterAction = async () => {
    await fetchProperties();
    await fetchDailyStats();
    fetchStatusCounts();
    setShowRejectForm(false);
    setSelectedReason("");
    setRejectionNotes("");
    setQuickOfferAmount("");
    setApprovePhase(null);
    setPendingApproveProperty(null);
    setCompsARV(null);
  };

  // Step 1: User clicks APROVAR → show choice (Comps or Skip)
  const handleStartApprove = () => {
    if (!currentProperty) return;
    setPendingApproveProperty(currentProperty);
    setApprovePhase('choose');
  };

  // Step 2a: User chooses COMPS → open modal
  const handleOpenComps = () => {
    if (pendingApproveProperty) {
      setCompsModalProperty(pendingApproveProperty);
      setApprovePhase('comps');
    }
  };

  // Step 2b: User chooses SKIP → go straight to offer
  const handleSkipComps = () => {
    setCompsARV(null);
    setApprovePhase('offer');
    // Pre-fill with 70% of estimated value
    if (pendingApproveProperty?.estimated_value) {
      setQuickOfferAmount(Math.round(pendingApproveProperty.estimated_value * 0.7).toString());
    }
  };

  // Step 3: Comps modal closed → fetch ARV from comps → show offer input
  const handleCompsModalClose = async () => {
    setCompsModalProperty(null);
    if (!pendingApproveProperty) {
      setApprovePhase(null);
      return;
    }
    // Fetch comps to calculate ARV
    try {
      const { data: comps } = await supabase
        .from('manual_comps_links' as any)
        .select('comp_data')
        .eq('property_id', pendingApproveProperty.id);

      const validComps = (comps as any[] || []).filter(
        (c: any) => c.comp_data?.sale_price && c.comp_data?.square_feet && c.comp_data.square_feet > 0
      );

      if (validComps.length > 0 && pendingApproveProperty.square_feet) {
        const avgPricePerSqft = validComps.reduce(
          (sum: number, c: any) => sum + (c.comp_data.sale_price / c.comp_data.square_feet), 0
        ) / validComps.length;
        const arv = Math.round(pendingApproveProperty.square_feet * avgPricePerSqft);
        setCompsARV(arv);
        // Pre-fill offer at 70% of ARV
        setQuickOfferAmount(Math.round(arv * 0.7).toString());
      } else {
        setCompsARV(null);
        if (pendingApproveProperty.estimated_value) {
          setQuickOfferAmount(Math.round(pendingApproveProperty.estimated_value * 0.7).toString());
        }
      }
    } catch {
      setCompsARV(null);
      if (pendingApproveProperty?.estimated_value) {
        setQuickOfferAmount(Math.round(pendingApproveProperty.estimated_value * 0.7).toString());
      }
    }
    setApprovePhase('offer');
  };

  // Step 4: Confirm offer → save to DB → advance
  const handleConfirmOffer = async () => {
    if (!userId || !userName || !pendingApproveProperty) return;
    setIsProcessing(true);
    try {
      const offerValue = quickOfferAmount ? parseFloat(quickOfferAmount) : null;
      const updateData: any = {
        approval_status: "approved",
        approved_by: userId,
        approved_by_name: userName,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
        rejection_notes: null,
        updated_by: userId,
        updated_by_name: userName,
      };
      if (offerValue && offerValue > 0) {
        updateData.cash_offer_amount = offerValue;
      }
      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", pendingApproveProperty.id);
      if (error) throw error;
      toast({
        title: "Aprovado!",
        description: `${pendingApproveProperty.address}${offerValue ? ` - Oferta: $${offerValue.toLocaleString()}` : ''}`,
      });
      setApprovePhase(null);
      setPendingApproveProperty(null);
      setCompsARV(null);
      setQuickOfferAmount("");
      await advanceAfterAction();
    } catch (error: any) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel the approve flow
  const handleCancelApprove = () => {
    setApprovePhase(null);
    setPendingApproveProperty(null);
    setCompsARV(null);
    setQuickOfferAmount("");
  };

  const handleReject = async () => {
    if (!userId || !userName || !currentProperty || !selectedReason) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          approval_status: "rejected",
          approved_by: userId,
          approved_by_name: userName,
          approved_at: new Date().toISOString(),
          rejection_reason: selectedReason,
          rejection_notes: rejectionNotes.trim() || null,
          updated_by: userId,
          updated_by_name: userName,
        } as any)
        .eq("id", currentProperty.id);
      if (error) throw error;
      const reasonLabel = REJECTION_REASONS.find(r => r.value === selectedReason)?.label;
      toast({
        title: "Rejeitado",
        description: `${currentProperty.address} - ${reasonLabel}`,
      });
      await advanceAfterAction();
    } catch (error: any) {
      toast({ title: "Erro ao rejeitar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (properties.length === 0 && statusFilter === 'pending') {
    return (
      <EmptyState
        icon={CheckCircle}
        title="Fila Vazia!"
        description="Não há propriedades pendentes para revisar."
        action={{
          label: "Ver Aprovadas",
          onClick: () => setStatusFilter('approved'),
        }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Stats Header - compact bar on mobile, cards on desktop */}
      {/* Mobile: single compact bar */}
      <div className="sm:hidden flex items-center justify-between gap-1 p-2 bg-card border rounded-lg">
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-sm font-bold">{dailyStats?.reviewed_today || 0}</span>
          <span className="text-[10px] text-muted-foreground">rev</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          <span className="text-sm font-bold text-green-700">{dailyStats?.approved_today || 0}</span>
          <span className="text-[10px] text-muted-foreground">ok</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5 text-red-500" />
          <span className="text-sm font-bold text-red-700">{dailyStats?.rejected_today || 0}</span>
          <span className="text-[10px] text-muted-foreground">rej</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-sm font-bold">{dailyStats?.total_pending || 0}</span>
          <span className="text-[10px] text-muted-foreground">fila</span>
        </div>
      </div>

      {/* Desktop: full cards */}
      <div className="hidden sm:grid sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 px-6">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{dailyStats?.reviewed_today || 0}</div>
              <p className="text-xs text-muted-foreground">Revisadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 px-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{dailyStats?.approved_today || 0}</div>
              <p className="text-xs text-muted-foreground">Aprovadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 px-6">
            <div className="text-center">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{dailyStats?.rejected_today || 0}</div>
              <p className="text-xs text-muted-foreground">Rejeitadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 px-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{dailyStats?.total_pending || 0}</div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 px-6">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">
                #{dailyStats?.user_rank || "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                Ranking
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="space-y-2">
        {/* Status filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {([
            { key: 'pending' as const, label: 'Pendentes', count: statusCounts.pending, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
            { key: 'approved' as const, label: 'Aprovados', count: statusCounts.approved, color: 'bg-green-100 text-green-800 border-green-300' },
            { key: 'rejected' as const, label: 'Rejeitados', count: statusCounts.rejected, color: 'bg-red-100 text-red-800 border-red-300' },
          ]).map(s => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`shrink-0 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors ${
                statusFilter === s.key
                  ? s.color + ' ring-2 ring-offset-1 ring-current'
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
              }`}
            >
              {s.label} <span className="font-bold">{s.count}</span>
            </button>
          ))}
        </div>

        {/* Visual filter */}
        {Object.keys(visualCounts).length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setVisualFilter('all')}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                visualFilter === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
              }`}
            >
              Todos {properties.length}
            </button>
            {(['HOT', 'WARM', 'COLD', 'LAND'] as const).map(v => {
              const count = visualCounts[v] || 0;
              if (count === 0) return null;
              const colors = VISUAL_COLORS[v];
              return (
                <button
                  key={v}
                  onClick={() => setVisualFilter(v)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    visualFilter === v
                      ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-offset-1 ring-current`
                      : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                  }`}
                >
                  {v} <span className="font-bold">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Review Card */}
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">
                {statusFilter === 'pending' ? 'Revisar' : statusFilter === 'approved' ? 'Aprovadas' : 'Rejeitadas'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredProperties.length > 0 ? `${currentIndex + 1} de ${filteredProperties.length}` : 'Nenhuma'}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm sm:text-lg px-2 py-1 sm:px-4 sm:py-2 shrink-0">
              {filteredProperties.length - currentIndex} restantes
            </Badge>
          </div>
          <Progress value={progress} className="mt-3 sm:mt-4" />
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
          {/* Property Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Image */}
            <div>
              <PropertyImageDisplay
                imageUrl={currentProperty.property_image_url}
                address={currentProperty.address}
              />
            </div>

            {/* Details */}
            <div className="space-y-3 sm:space-y-4">
              {/* Address + Location */}
              <div>
                <h3 className="text-lg sm:text-2xl font-bold mb-1 line-clamp-2">{currentProperty.address}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {[currentProperty.city, currentProperty.state, currentProperty.zip_code].filter(Boolean).join(', ')}
                </p>
              </div>

              {/* Tags badges */}
              {(() => {
                const rawTags = currentProperty.tags;
                let tagList: string[] = [];
                if (Array.isArray(rawTags)) tagList = rawTags;
                else if (typeof rawTags === 'string' && rawTags.startsWith('[')) {
                  try { tagList = JSON.parse(rawTags.replace(/'/g, '"')); } catch {}
                }
                if (tagList.length === 0) return null;
                const tagColors: Record<string, string> = {
                  'HOT': 'bg-red-100 text-red-700 border-red-300',
                  'WARM': 'bg-orange-100 text-orange-700 border-orange-300',
                  'COLD': 'bg-blue-100 text-blue-700 border-blue-300',
                  'LAND': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                  '1-CALL_NOW': 'bg-red-100 text-red-700 border-red-300',
                  '2-CALL_SOON': 'bg-orange-100 text-orange-700 border-orange-300',
                  '3-EVALUATE': 'bg-amber-100 text-amber-700 border-amber-300',
                  '5-NO_VISUAL': 'bg-gray-100 text-gray-600 border-gray-300',
                  '6-LOW_PRIORITY': 'bg-slate-100 text-slate-600 border-slate-300',
                };
                return (
                  <div className="flex flex-wrap gap-1">
                    {tagList.map(tag => (
                      <Badge key={tag} variant="outline" className={`text-[10px] sm:text-xs font-semibold ${tagColors[tag] || 'bg-gray-50 text-gray-600 border-gray-300'}`}>
                        {tag.replace(/^\d+-/, '').replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                );
              })()}

              {/* Pre-denial warnings */}
              {(() => {
                const suggestions = getPreDenialSuggestions(currentProperty);
                if (suggestions.length === 0) return null;
                return (
                  <div className="p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-800 mb-1">PRE-NEGACAO SUGERIDA:</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestions.map(s => (
                        <Badge key={s.reason} variant="outline" className="text-[10px] sm:text-xs border-amber-400 text-amber-700 bg-amber-100">
                          {s.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* External Links */}
              <div className="flex flex-wrap gap-1.5">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentProperty.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors"><MapPin className="w-3 h-3" />Maps</a>
                <a href={currentProperty.zillow_url || `https://www.zillow.com/homes/${encodeURIComponent(currentProperty.address)}_rb/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors"><span className="font-bold">Z</span>Zillow{currentProperty.zillow_url && <ExternalLink className="w-2.5 h-2.5" />}</a>
                <a href={`https://www.trulia.com/homes/${encodeURIComponent(currentProperty.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold hover:bg-green-100 transition-colors"><span className="font-bold">T</span>Trulia</a>
                <a href={`https://www.redfin.com/search#query=${encodeURIComponent(currentProperty.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold hover:bg-red-100 transition-colors"><span className="font-bold">R</span>Redfin</a>
                <a href={`https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(currentProperty.address.replace(/\s+/g, '-'))}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold hover:bg-orange-100 transition-colors"><span className="font-bold">Re</span>Realtor</a>
              </div>

              {/* Keyboard Shortcuts - condensed */}
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
                <Keyboard className="h-3.5 w-3.5" />
                <span><kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">A</kbd> Aprovar</span>
                <span><kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">R</kbd> Rejeitar</span>
                <span><kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">→</kbd> Próx.</span>
                <span><kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">←</kbd> Ant.</span>
              </div>
            </div>
          </div>

          {/* Property Details - configurable with fill rates */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-b">
              <button
                onClick={() => setDetailsExpanded(!detailsExpanded)}
                className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors"
              >
                {detailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Detalhes
                <Badge variant="secondary" className="text-[10px]">{visibleFields.size} campos</Badge>
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground"
                onClick={() => setShowFieldSettings(!showFieldSettings)}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Colunas
              </Button>
            </div>

            {/* Field Settings Panel with % fill rates */}
            {showFieldSettings && (
              <div className="bg-muted/20 border-b px-3 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Dados disponíveis neste batch ({properties.length} imóveis)
                  </p>
                </div>
                {(['decisao', 'financeiro', 'imovel', 'dono'] as const).map(category => {
                  const fields = DETAIL_FIELDS.filter(f => f.category === category);
                  return (
                    <div key={category}>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">{CATEGORY_LABELS[category]}</p>
                      <div className="space-y-1">
                        {fields.map(field => {
                          const pct = fillRates.get(field.key) ?? 0;
                          const isVisible = visibleFields.has(field.key);
                          const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : pct > 0 ? 'bg-red-400' : 'bg-gray-300';
                          return (
                            <button
                              key={field.key}
                              onClick={() => toggleField(field.key)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] border transition-all ${
                                isVisible
                                  ? 'bg-primary/5 border-primary/30 text-foreground'
                                  : 'bg-background border-border/50 text-muted-foreground hover:bg-accent/50'
                              }`}
                            >
                              {isVisible ? <Eye className="h-3 w-3 text-primary shrink-0" /> : <EyeOff className="h-3 w-3 shrink-0" />}
                              <span className="w-20 text-left truncate font-medium">{field.label}</span>
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`w-8 text-right text-[10px] font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : pct > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                {pct}%
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  Clique para mostrar/ocultar. Barra = % de dados disponíveis no batch.
                </p>
              </div>
            )}

            {/* Detail Values */}
            {detailsExpanded && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {DETAIL_FIELDS.filter(f => visibleFields.has(f.key)).map(field => {
                  const value = field.format(currentProperty);
                  const isHighlight = field.highlight?.(currentProperty) ?? false;
                  return (
                    <div key={field.key} className={`px-3 py-2 border-t border-r ${isHighlight ? 'bg-emerald-50' : ''}`}>
                      <p className="text-[10px] text-muted-foreground">{field.label}</p>
                      <p className={`text-xs font-semibold truncate ${value ? (isHighlight ? 'text-emerald-700' : '') : 'text-muted-foreground/40'}`}>
                        {value || '—'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action area */}
          <div className="pt-3 sm:pt-4 border-t space-y-3">
            {statusFilter !== 'pending' ? (
              /* Read-only mode: just navigation */
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="text-xs text-muted-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Anterior
                </Button>
                <Badge variant="secondary" className="text-xs">
                  {statusFilter === 'approved' ? 'Aprovada' : 'Rejeitada'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === filteredProperties.length - 1}
                  className="text-xs text-muted-foreground"
                >
                  Próxima
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            ) : approvePhase === 'choose' ? (
              /* Phase 1: Choose Comps or Skip */
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-bold text-blue-800">Adicionar comps antes da oferta?</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelApprove}
                    className="text-xs text-muted-foreground gap-1 h-7"
                  >
                    <Undo2 className="h-3 w-3" />
                    <kbd className="px-1 py-0.5 text-[10px] bg-white border rounded">Esc</kbd>
                  </Button>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    onClick={handleOpenComps}
                    className="flex-1 h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-lg font-bold gap-2"
                  >
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                    COMPS
                    <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-blue-800/40 rounded">C</kbd>
                  </Button>
                  <Button
                    onClick={handleSkipComps}
                    variant="outline"
                    className="flex-1 h-12 sm:h-14 border-blue-300 text-blue-700 hover:bg-blue-100 text-sm sm:text-lg font-bold gap-2"
                  >
                    <SkipForward className="h-5 w-5 sm:h-6 sm:w-6" />
                    PULAR
                    <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-blue-100 border-blue-200 border rounded">N</kbd>
                  </Button>
                </div>
              </div>
            ) : approvePhase === 'offer' ? (
              /* Phase 2: Offer input (after comps or skip) */
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-green-800">
                    Definir Valor da Oferta
                    {compsARV && <span className="ml-2 text-xs font-normal text-green-600">(ARV: ${compsARV.toLocaleString()})</span>}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelApprove}
                    className="text-xs text-muted-foreground gap-1 h-7"
                  >
                    <Undo2 className="h-3 w-3" />
                    Voltar
                    <kbd className="px-1 py-0.5 text-[10px] bg-white border rounded ml-1">Esc</kbd>
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-lg font-bold text-green-700">$</span>
                    <Input
                      type="number"
                      placeholder="Ex: 150000"
                      value={quickOfferAmount}
                      onChange={(e) => setQuickOfferAmount(e.target.value)}
                      className="pl-8 h-12 text-lg font-bold border-green-300 focus:border-green-500"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Quick percentage buttons based on ARV or estimated_value */}
                {(() => {
                  const baseValue = compsARV || pendingApproveProperty?.estimated_value;
                  if (!baseValue || baseValue <= 0) return null;
                  const label = compsARV ? 'ARV' : 'Est.';
                  return (
                    <div className="flex gap-1.5 flex-wrap">
                      {[60, 65, 70, 75, 80].map(pct => {
                        const val = Math.round(baseValue * (pct / 100));
                        return (
                          <button
                            key={pct}
                            onClick={() => setQuickOfferAmount(val.toString())}
                            className={`px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
                              quickOfferAmount === val.toString()
                                ? 'bg-green-600 text-white border-green-600 font-bold'
                                : 'bg-white text-green-800 border-green-200 hover:bg-green-100'
                            }`}
                          >
                            {pct}% {label} = ${val.toLocaleString()}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <Button
                    onClick={handleConfirmOffer}
                    disabled={isProcessing}
                    className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                  >
                    <ThumbsUp className="h-5 w-5" />
                    {isProcessing ? "..." : quickOfferAmount ? `APROVAR ($${Number(quickOfferAmount).toLocaleString()})` : "APROVAR SEM OFERTA"}
                    <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-green-800/40 rounded">Enter</kbd>
                  </Button>
                </div>
              </div>
            ) : !showRejectForm ? (
              <>
                {/* Main action row */}
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    onClick={handleStartApprove}
                    disabled={isProcessing}
                    className="flex-1 h-12 sm:h-14 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-lg font-bold gap-2"
                  >
                    <ThumbsUp className="h-5 w-5 sm:h-6 sm:w-6" />
                    {isProcessing ? "..." : "APROVAR"}
                    <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-green-800/40 rounded">A</kbd>
                  </Button>
                  <Button
                    onClick={() => setShowRejectForm(true)}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1 h-12 sm:h-14 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 text-sm sm:text-lg font-bold gap-2"
                  >
                    <ThumbsDown className="h-5 w-5 sm:h-6 sm:w-6" />
                    REJEITAR
                    <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-red-100 border-red-200 border rounded">R</kbd>
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="text-xs text-muted-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === filteredProperties.length - 1}
                    className="text-xs text-muted-foreground"
                  >
                    Pular
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </>
            ) : (
              /* Inline Rejection Form */
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-red-800">Motivo da Rejeição</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowRejectForm(false); setSelectedReason(""); setRejectionNotes(""); }}
                    className="text-xs text-muted-foreground gap-1 h-7"
                  >
                    <Undo2 className="h-3 w-3" />
                    Voltar
                    <kbd className="px-1 py-0.5 text-[10px] bg-white border rounded ml-1">Esc</kbd>
                  </Button>
                </div>

                {/* Quick reason buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {REJECTION_REASONS.map((reason, index) => (
                    <button
                      key={reason.value}
                      onClick={() => setSelectedReason(reason.value)}
                      className={`text-left px-2.5 py-2 rounded-md text-xs sm:text-sm border transition-colors ${
                        selectedReason === reason.value
                          ? 'bg-red-600 text-white border-red-600 font-semibold'
                          : 'bg-white text-red-800 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <kbd className={`px-1 py-0.5 text-[10px] rounded ${
                          selectedReason === reason.value ? 'bg-red-800/40' : 'bg-red-100 border border-red-200'
                        }`}>
                          {index + 1 <= 9 ? index + 1 : ''}
                        </kbd>
                        {reason.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-xs text-red-800">Notas (opcional)</Label>
                  <Textarea
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Detalhes adicionais..."
                    rows={2}
                    className="mt-1 text-sm bg-white"
                  />
                </div>

                {/* Confirm reject button */}
                <Button
                  onClick={handleReject}
                  disabled={isProcessing || !selectedReason}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
                >
                  <XCircle className="h-5 w-5" />
                  {isProcessing ? "Rejeitando..." : "CONFIRMAR REJEIÇÃO"}
                  <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-red-800/40 rounded">Enter</kbd>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comps Modal - opens after approving */}
      <CompsModal
        open={!!compsModalProperty}
        onClose={handleCompsModalClose}
        property={compsModalProperty}
      />
    </div>
  );
};
