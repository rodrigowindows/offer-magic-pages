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

// Build detail rows - only shows fields with actual data (no empty dashes)
interface DetailRow {
  label: string;
  value: string;
  highlight?: boolean;
}

const buildPropertyDetails = (prop: QueueProperty): DetailRow[] => {
  const rows: DetailRow[] = [];

  // Decision-critical: Evaluation tier + Lead Score
  if (prop.evaluation) {
    // Parse evaluation string like "Score:240 | Combined:260 | Tier:1-CALL_NOW | Visual:HOT | Cond:3"
    const tierMatch = prop.evaluation.match(/Tier:(\S+)/);
    const visualMatch = prop.evaluation.match(/Visual:(\S+)/);
    const condMatch = prop.evaluation.match(/Cond:(\d+)/);
    const tier = tierMatch?.[1] || '';
    const visual = visualMatch?.[1] || '';
    const cond = condMatch?.[1] || '';
    const tierLabel = tier.replace(/^\d+-/, '').replace(/_/g, ' ');
    rows.push({
      label: 'Tier',
      value: `${tierLabel}${visual ? ` (${visual})` : ''}${cond ? ` | Cond:${cond}` : ''}`,
      highlight: tier.startsWith('1-') || visual === 'HOT',
    });
  }
  if (prop.lead_score) rows.push({ label: 'Lead Score', value: String(prop.lead_score), highlight: prop.lead_score >= 230 });

  // Financial
  if (prop.estimated_value) rows.push({ label: 'Valor Estimado', value: `$${prop.estimated_value.toLocaleString()}` });
  if (prop.cash_offer_amount) rows.push({ label: 'Oferta', value: `$${prop.cash_offer_amount.toLocaleString()}` });

  // Property info
  if (prop.year_built) rows.push({ label: 'Ano Construção', value: String(prop.year_built) });
  if (prop.bedrooms || prop.bathrooms) {
    const parts = [];
    if (prop.bedrooms) parts.push(`${prop.bedrooms} quartos`);
    if (prop.bathrooms) parts.push(`${prop.bathrooms} ban.`);
    rows.push({ label: 'Quartos/Ban.', value: parts.join(' / ') });
  }
  if (prop.lot_size) {
    // lot_size is in acres for Orlando batch
    const acres = Number(prop.lot_size);
    rows.push({ label: 'Lote', value: acres >= 1 ? `${acres.toFixed(1)} acres` : `${(acres * 43560).toFixed(0)} sqft` });
  }
  if (prop.square_feet) rows.push({ label: 'Área (sqft)', value: prop.square_feet.toLocaleString() });
  if (prop.property_type) rows.push({ label: 'Tipo', value: prop.property_type });
  if (prop.neighborhood) rows.push({ label: 'Bairro', value: prop.neighborhood });

  // Owner / contact
  if (prop.owner_name) rows.push({ label: 'Proprietário', value: prop.owner_name });
  if (prop.owner_address) rows.push({ label: 'End. Dono', value: prop.owner_address });
  if (prop.owner_phone) rows.push({ label: 'Telefone', value: prop.owner_phone });
  if (prop.origem) rows.push({ label: 'Parcel ID', value: prop.origem });
  if (prop.focar) rows.push({ label: 'Focar', value: prop.focar, highlight: prop.focar === 'SIM' });

  return rows;
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
  // Inline rejection state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  // Quick offer on approve
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [quickOfferAmount, setQuickOfferAmount] = useState("");
  // Post-approve: choice to do comps or advance
  const [approvedProperty, setApprovedProperty] = useState<QueueProperty | null>(null);
  const [compsModalProperty, setCompsModalProperty] = useState<QueueProperty | null>(null);
  const { user, userId, userName } = useCurrentUser();
  const { toast } = useToast();

  const currentProperty = properties[currentIndex];
  const progress = properties.length > 0 ? ((currentIndex + 1) / properties.length) * 100 : 0;

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

  // Keyboard shortcuts: A = approve, R = reject, arrows = navigate, 1-9 = reasons, Enter = confirm, C = comps, N = next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isProcessing) return;

      // Post-approve choice: C = comps, N = next
      if (approvedProperty) {
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
        }
        return;
      }

      if (!currentProperty) return;

      switch (e.key) {
        case 'a':
        case 'A':
          if (!showRejectForm && !showOfferInput) {
            e.preventDefault();
            setShowOfferInput(true);
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
  }, [currentIndex, properties.length, currentProperty, showRejectForm, showOfferInput, selectedReason, isProcessing, approvedProperty]);

  const fetchPendingProperties = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("properties")
        .select("id, address, city, state, zip_code, neighborhood, owner_name, property_image_url, estimated_value, cash_offer_amount, approval_status, property_type, year_built, square_feet, bedrooms, bathrooms, lot_size, owner_phone, lead_score, zillow_url, focar, evaluation, tags, owner_address, origem")
        .or("approval_status.is.null,approval_status.eq.pending")
        .order("created_at", { ascending: true })
        .limit(500);

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
      // Show post-approve choice (Comps or Next)
      const approvedProp = { ...currentProperty, cash_offer_amount: offerValue ?? currentProperty.cash_offer_amount };
      setApprovedProperty(approvedProp);
      setShowOfferInput(false);
      setQuickOfferAmount("");
    } catch (error: any) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenComps = () => {
    if (approvedProperty) {
      setCompsModalProperty(approvedProperty);
      setApprovedProperty(null);
    }
  };

  const handleSkipComps = async () => {
    setApprovedProperty(null);
    await advanceAfterAction();
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

          {/* Property Details - only fields with actual data */}
          {(() => {
            const details = buildPropertyDetails(currentProperty);
            if (details.length === 0) return null;
            return (
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setDetailsExpanded(!detailsExpanded)}
                  className="w-full flex items-center justify-between bg-muted/50 px-3 py-2 hover:bg-muted/70 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {detailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Detalhes
                    <Badge variant="secondary" className="text-[10px]">{details.length}</Badge>
                  </span>
                </button>
                {detailsExpanded && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                    {details.map((row) => (
                      <div key={row.label} className={`px-3 py-2 border-t border-r ${row.highlight ? 'bg-emerald-50' : ''}`}>
                        <p className="text-[10px] text-muted-foreground">{row.label}</p>
                        <p className={`text-xs font-semibold truncate ${row.highlight ? 'text-emerald-700' : ''}`}>
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Inline Approve / Reject Buttons */}
          <div className="pt-3 sm:pt-4 border-t space-y-3">
            {approvedProperty ? (
              /* Post-approve choice: Comps or Next */
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-bold text-green-800">Aprovado! Deseja adicionar comps?</p>
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
                    className="flex-1 h-12 sm:h-14 border-green-300 text-green-700 hover:bg-green-100 text-sm sm:text-lg font-bold gap-2"
                  >
                    <SkipForward className="h-5 w-5 sm:h-6 sm:w-6" />
                    PROXIMA
                    <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-green-100 border-green-200 border rounded">N</kbd>
                  </Button>
                </div>
              </div>
            ) : showOfferInput ? (
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
