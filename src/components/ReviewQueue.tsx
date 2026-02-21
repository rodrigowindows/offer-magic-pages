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
  Phone,
  Mail,
  Calendar,
  Home,
  Ruler,
  User,
  AlertTriangle,
  Star,
  ExternalLink,
  BedDouble,
  Bath,
  LandPlot,
  Building2,
  PhoneOff,
  ChevronDown,
  ChevronUp,
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

// Configurable detail fields
interface DetailField {
  key: string;
  label: string;
  category: 'property' | 'owner' | 'financial' | 'status';
  format?: (value: any, prop: QueueProperty) => string;
  defaultVisible?: boolean;
}

const DETAIL_FIELDS: DetailField[] = [
  // Property
  { key: 'property_type', label: 'Tipo', category: 'property', defaultVisible: true },
  { key: 'year_built', label: 'Ano Construção', category: 'property', defaultVisible: true },
  { key: 'bedrooms', label: 'Quartos', category: 'property', defaultVisible: true },
  { key: 'bathrooms', label: 'Banheiros', category: 'property', defaultVisible: true },
  { key: 'square_feet', label: 'Área (sqft)', category: 'property', defaultVisible: true, format: (v) => v ? v.toLocaleString() : '—' },
  { key: 'lot_size', label: 'Lote (sqft)', category: 'property', defaultVisible: true, format: (v) => v ? v.toLocaleString() : '—' },
  { key: 'neighborhood', label: 'Bairro', category: 'property', defaultVisible: false },
  { key: 'county', label: 'Condado', category: 'property', defaultVisible: false },
  { key: 'zip_code', label: 'CEP', category: 'property', defaultVisible: false },
  { key: 'last_sale_date', label: 'Últ. Venda', category: 'property', defaultVisible: true, format: (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '—' },
  // Owner
  { key: 'owner_name', label: 'Proprietário', category: 'owner', defaultVisible: true },
  { key: 'age', label: 'Idade', category: 'owner', defaultVisible: true, format: (v) => v ? `${v} anos` : '—' },
  { key: 'phone1', label: 'Telefone', category: 'owner', defaultVisible: true, format: (v, p) => v || p.owner_phone || '—' },
  { key: 'phone1_type', label: 'Tipo Tel.', category: 'owner', defaultVisible: false },
  { key: 'email1', label: 'Email', category: 'owner', defaultVisible: true },
  { key: 'deceased', label: 'Falecido', category: 'owner', defaultVisible: true, format: (v) => v ? 'SIM' : 'Não' },
  { key: 'dnc_flag', label: 'DNC', category: 'owner', defaultVisible: true, format: (v) => v ? 'SIM' : 'Não' },
  // Financial
  { key: 'estimated_value', label: 'Valor Estimado', category: 'financial', defaultVisible: true, format: (v) => v ? `$${v.toLocaleString()}` : '—' },
  { key: 'cash_offer_amount', label: 'Oferta', category: 'financial', defaultVisible: true, format: (v) => v ? `$${v.toLocaleString()}` : '—' },
  { key: 'comparative_price', label: 'Preço Comp.', category: 'financial', defaultVisible: true, format: (v) => v ? `$${v.toLocaleString()}` : '—' },
  // Status
  { key: 'lead_score', label: 'Score', category: 'status', defaultVisible: false },
  { key: 'tags', label: 'Tags', category: 'status', defaultVisible: false },
  { key: 'airbnb_eligible', label: 'Airbnb', category: 'status', defaultVisible: false, format: (v) => v ? 'Sim' : 'Não' },
  { key: 'focar', label: 'Focar', category: 'status', defaultVisible: false },
  { key: 'batch_name', label: 'Batch', category: 'status', defaultVisible: false },
];

const CATEGORY_LABELS: Record<string, string> = {
  property: 'Imóvel',
  owner: 'Proprietário',
  financial: 'Financeiro',
  status: 'Status',
};

const STORAGE_KEY = 'review-queue-visible-fields';

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

interface QueueProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  county: string | null;
  neighborhood: string | null;
  owner_name: string;
  property_image_url: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  comparative_price: number | null;
  approval_status: string | null;
  property_type: string | null;
  year_built: number | null;
  last_sale_date: string | null;
  square_feet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lot_size: number | null;
  batch_name: string | null;
  // Owner / contact
  age: number | null;
  deceased: boolean | null;
  owner_phone: string | null;
  phone1: string | null;
  phone1_type: string | null;
  email1: string | null;
  dnc_flag: boolean | null;
  // Extra
  lead_score: number | null;
  tags: string | null;
  zillow_url: string | null;
  airbnb_eligible: boolean | null;
  focar: string | null;
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

  // Recém vendida (menos de 2 anos)
  if (prop.last_sale_date) {
    const saleDate = new Date(prop.last_sale_date);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    if (saleDate > twoYearsAgo) {
      suggestions.push({ reason: 'recent-sale', label: 'Recém Vendida (<2 anos)' });
    }
  }

  // Multi-Family
  if (prop.property_type?.toLowerCase().includes('multi')) {
    suggestions.push({ reason: 'multi-family', label: 'Multi-Family' });
  }

  // Land
  if (prop.property_type?.toLowerCase() === 'land' || prop.property_type?.toLowerCase() === 'vacant land') {
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

interface ReviewQueueProps {
  selectedBatch?: string;
}

export const ReviewQueue = ({ selectedBatch }: ReviewQueueProps) => {
  const [properties, setProperties] = useState<QueueProperty[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // Detail fields visibility
  const [visibleFields, setVisibleFields] = useState<Set<string>>(loadVisibleFields);
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  // Inline rejection state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  // Quick offer on approve
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [quickOfferAmount, setQuickOfferAmount] = useState("");
  // Comps modal after approve
  const [compsModalProperty, setCompsModalProperty] = useState<QueueProperty | null>(null);
  const { user, userId, userName } = useCurrentUser();
  const { toast } = useToast();

  const currentProperty = properties[currentIndex];
  const progress = properties.length > 0 ? ((currentIndex + 1) / properties.length) * 100 : 0;

  const toggleField = (key: string) => {
    setVisibleFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveVisibleFields(next);
      return next;
    });
  };

  const getFieldValue = (field: DetailField, prop: QueueProperty): string => {
    const raw = (prop as any)[field.key];
    if (field.format) return field.format(raw, prop);
    if (raw == null || raw === '') return '—';
    return String(raw);
  };

  useEffect(() => {
    fetchPendingProperties();
    if (user) {
      fetchDailyStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedBatch]);

  // Reset forms when changing property
  useEffect(() => {
    setShowRejectForm(false);
    setSelectedReason("");
    setRejectionNotes("");
    setShowOfferInput(false);
    setQuickOfferAmount("");
  }, [currentIndex]);

  // Keyboard shortcuts: A = approve, R = reject, arrows = navigate, 1-9 = reasons, Enter = confirm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!currentProperty || isProcessing) return;

      switch (e.key) {
        case 'a':
        case 'A':
          if (!showRejectForm && !showOfferInput) {
            e.preventDefault();
            setShowOfferInput(true);
            // Pre-fill with cash_offer_amount if available
            if (currentProperty.cash_offer_amount) {
              setQuickOfferAmount(currentProperty.cash_offer_amount.toString());
            }
          }
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          setShowRejectForm(true);
          break;
        case 'ArrowRight':
          if (!showRejectForm && !showOfferInput) {
            e.preventDefault();
            handleNext();
          }
          break;
        case 'ArrowLeft':
          if (!showRejectForm && !showOfferInput) {
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
          if (showOfferInput) {
            e.preventDefault();
            setShowOfferInput(false);
            setQuickOfferAmount("");
          }
          break;
        case 'Enter':
          if (showRejectForm && selectedReason) {
            e.preventDefault();
            handleReject();
          }
          if (showOfferInput) {
            e.preventDefault();
            handleApproveWithOffer();
          }
          break;
        default:
          // Number keys 1-9 for quick rejection reason selection
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
  }, [currentIndex, properties.length, currentProperty, showRejectForm, showOfferInput, selectedReason, isProcessing]);

  const fetchPendingProperties = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("properties")
        .select("id, address, city, state, zip_code, county, neighborhood, owner_name, property_image_url, estimated_value, cash_offer_amount, comparative_price, approval_status, property_type, year_built, last_sale_date, square_feet, bedrooms, bathrooms, lot_size, batch_name, age, deceased, owner_phone, phone1, phone1_type, email1, dnc_flag, lead_score, tags, zillow_url, airbnb_eligible, focar")
        .or("approval_status.is.null,approval_status.eq.pending")
        .order("created_at", { ascending: true })
        .limit(100);

      if (selectedBatch && selectedBatch !== 'all') {
        query = query.eq('import_batch', selectedBatch);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProperties((data as unknown as QueueProperty[]) || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar fila",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
    if (currentIndex < properties.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast({
        title: "🎉 Parabéns!",
        description: "Você revisou todas as propriedades da fila!",
      });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const advanceAfterAction = async () => {
    await fetchPendingProperties();
    await fetchDailyStats();
    setShowRejectForm(false);
    setSelectedReason("");
    setRejectionNotes("");
    setShowOfferInput(false);
    setQuickOfferAmount("");
  };

  const handleApprove = async () => {
    if (!userId || !userName || !currentProperty) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          approval_status: "approved",
          approved_by: userId,
          approved_by_name: userName,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
          rejection_notes: null,
          updated_by: userId,
          updated_by_name: userName,
        } as any)
        .eq("id", currentProperty.id);
      if (error) throw error;
      toast({
        title: "Aprovado!",
        description: currentProperty.address,
      });
      await advanceAfterAction();
    } catch (error: any) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveWithOffer = async () => {
    if (!userId || !userName || !currentProperty) return;
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
        .eq("id", currentProperty.id);
      if (error) throw error;
      toast({
        title: "Aprovado!",
        description: `${currentProperty.address}${offerValue ? ` - Oferta: $${offerValue.toLocaleString()}` : ''}`,
      });
      // Open comps modal for this property before advancing
      const approvedProp = { ...currentProperty, cash_offer_amount: offerValue ?? currentProperty.cash_offer_amount };
      setCompsModalProperty(approvedProp);
      // Reset offer input but don't advance yet (modal will trigger advance on close)
      setShowOfferInput(false);
      setQuickOfferAmount("");
    } catch (error: any) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompsModalClose = async () => {
    setCompsModalProperty(null);
    await advanceAfterAction();
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

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle}
        title="Fila Vazia! 🎉"
        description="Parabéns! Não há propriedades pendentes para revisar. Você está em dia com o trabalho!"
        action={{
          label: "Ver Todas as Propriedades",
          onClick: () => {
            const tabs = document.querySelector('[value="properties"]') as HTMLElement;
            tabs?.click();
          },
        }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Stats Header */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
            <div className="text-center">
              <Target className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-blue-500" />
              <div className="text-lg sm:text-2xl font-bold">{dailyStats?.reviewed_today || 0}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Revisadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-green-500" />
              <div className="text-lg sm:text-2xl font-bold">{dailyStats?.approved_today || 0}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Aprovadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
            <div className="text-center">
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-red-500" />
              <div className="text-lg sm:text-2xl font-bold">{dailyStats?.rejected_today || 0}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Rejeitadas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hidden sm:block">
          <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-orange-500" />
              <div className="text-lg sm:text-2xl font-bold">{dailyStats?.total_pending || 0}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hidden sm:block">
          <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
            <div className="text-center">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-yellow-500" />
              <div className="text-lg sm:text-2xl font-bold">
                #{dailyStats?.user_rank || "-"}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Ranking
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Review Card */}
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Revisar Propriedades</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {currentIndex + 1} de {properties.length}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm sm:text-lg px-2 py-1 sm:px-4 sm:py-2 shrink-0">
              {properties.length - currentIndex} restantes
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
                  {currentProperty.county && <span className="ml-1 text-muted-foreground/70">({currentProperty.county})</span>}
                </p>
              </div>

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

              {/* Alert flags */}
              {(currentProperty.deceased || currentProperty.dnc_flag) && (
                <div className="flex flex-wrap gap-1.5">
                  {currentProperty.deceased && (
                    <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />Falecido</Badge>
                  )}
                  {currentProperty.dnc_flag && (
                    <Badge variant="destructive" className="text-[10px] gap-1"><PhoneOff className="h-3 w-3" />DNC</Badge>
                  )}
                </div>
              )}

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

          {/* Configurable Details Table */}
          <div className="border rounded-lg overflow-hidden">
            {/* Table Header with toggle + settings */}
            <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-b">
              <button
                onClick={() => setDetailsExpanded(!detailsExpanded)}
                className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                {detailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Detalhes da Propriedade
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

            {/* Field Settings Panel */}
            {showFieldSettings && (
              <div className="bg-muted/30 border-b px-3 py-2.5 space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Selecione os campos visíveis:</p>
                {(['property', 'owner', 'financial', 'status'] as const).map(category => (
                  <div key={category}>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">{CATEGORY_LABELS[category]}</p>
                    <div className="flex flex-wrap gap-1">
                      {DETAIL_FIELDS.filter(f => f.category === category).map(field => (
                        <button
                          key={field.key}
                          onClick={() => toggleField(field.key)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-colors ${
                            visibleFields.has(field.key)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:bg-accent'
                          }`}
                        >
                          {visibleFields.has(field.key) ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {field.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Detail Table */}
            {detailsExpanded && (
              <div className="divide-y">
                {(['property', 'owner', 'financial', 'status'] as const).map(category => {
                  const fields = DETAIL_FIELDS.filter(f => f.category === category && visibleFields.has(f.key));
                  if (fields.length === 0) return null;
                  return (
                    <div key={category}>
                      <div className="bg-muted/30 px-3 py-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{CATEGORY_LABELS[category]}</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                        {fields.map(field => {
                          const value = getFieldValue(field, currentProperty);
                          const isAlert = (field.key === 'deceased' && currentProperty.deceased) ||
                                          (field.key === 'dnc_flag' && currentProperty.dnc_flag);
                          return (
                            <div key={field.key} className={`px-3 py-2 border-r border-b last:border-r-0 ${isAlert ? 'bg-red-50' : ''}`}>
                              <p className="text-[10px] text-muted-foreground truncate">{field.label}</p>
                              <p className={`text-xs font-medium truncate ${isAlert ? 'text-red-600 font-bold' : ''}`}>
                                {value}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inline Approve / Reject Buttons */}
          <div className="pt-3 sm:pt-4 border-t space-y-3">
            {showOfferInput ? (
              /* Offer Input before Approve */
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-green-800">Definir Valor da Oferta (opcional)</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowOfferInput(false); setQuickOfferAmount(""); }}
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
                      placeholder={currentProperty.estimated_value ? `Sugestao: ${Math.round(currentProperty.estimated_value * 0.7).toLocaleString()}` : "Ex: 150000"}
                      value={quickOfferAmount}
                      onChange={(e) => setQuickOfferAmount(e.target.value)}
                      className="pl-8 h-12 text-lg font-bold border-green-300 focus:border-green-500"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Quick percentage buttons */}
                {currentProperty.estimated_value && currentProperty.estimated_value > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {[60, 65, 70, 75, 80].map(pct => {
                      const val = Math.round(currentProperty.estimated_value * (pct / 100));
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
                          {pct}% = ${val.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleApproveWithOffer}
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
                    onClick={() => {
                      setShowOfferInput(true);
                      if (currentProperty.cash_offer_amount) {
                        setQuickOfferAmount(currentProperty.cash_offer_amount.toString());
                      }
                    }}
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
                    disabled={currentIndex === properties.length - 1}
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
