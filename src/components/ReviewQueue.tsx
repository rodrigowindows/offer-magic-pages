import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  MapPin
} from "lucide-react";
import { PropertyApprovalDialog } from "./PropertyApprovalDialog";
import { PropertyImageDisplay } from "./PropertyImageDisplay";
import { EmptyState } from "./EmptyState";

interface QueueProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  owner_name: string;
  property_image_url: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  approval_status: string | null;
  property_type: string | null;
  year_built: number | null;
  last_sale_date: string | null;
  square_feet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lot_size: number | null;
  batch_name: string | null;
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

export const ReviewQueue = () => {
  const [properties, setProperties] = useState<QueueProperty[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useCurrentUser();
  const { toast } = useToast();

  const currentProperty = properties[currentIndex];
  const progress = properties.length > 0 ? ((currentIndex + 1) / properties.length) * 100 : 0;

  useEffect(() => {
    fetchPendingProperties();
    if (user) {
      fetchDailyStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Keyboard shortcuts: A = approve, R = reject, arrows = navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isDialogOpen) return;
      if (!currentProperty) return;

      switch (e.key) {
        case 'a':
        case 'A':
          e.preventDefault();
          setIsDialogOpen(true);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          setIsDialogOpen(true);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, properties.length, isDialogOpen, currentProperty]);

  const fetchPendingProperties = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("id, address, city, state, owner_name, property_image_url, estimated_value, cash_offer_amount, approval_status, property_type, year_built, last_sale_date, square_feet, bedrooms, bathrooms, lot_size, batch_name")
        .or("approval_status.is.null,approval_status.eq.pending")
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      setProperties(data || []);
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

      // Get total pending
      const { count: totalPending, error: countError } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .or("approval_status.is.null,approval_status.eq.pending");

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

  const handleStatusChange = async () => {
    await fetchPendingProperties();
    await fetchDailyStats();

    // Move to next property after approval/rejection
    if (currentIndex < properties.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }

    setIsDialogOpen(false);
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
              <div>
                <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 line-clamp-2">{currentProperty.address}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {[currentProperty.city, currentProperty.state].filter(Boolean).join(', ')}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground">Proprietário: {currentProperty.owner_name}</p>

                {/* Pre-denial warnings */}
                {(() => {
                  const suggestions = getPreDenialSuggestions(currentProperty);
                  if (suggestions.length === 0) return null;
                  return (
                    <div className="mt-2 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs font-semibold text-amber-800 mb-1">PRÉ-NEGAÇÃO SUGERIDA:</p>
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

                {/* Property details */}
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                  {currentProperty.property_type && (
                    <Badge variant="secondary" className="text-[10px]">{currentProperty.property_type}</Badge>
                  )}
                  {currentProperty.year_built && (
                    <Badge variant="secondary" className="text-[10px]">Construído: {currentProperty.year_built}</Badge>
                  )}
                  {currentProperty.square_feet && (
                    <Badge variant="secondary" className="text-[10px]">{currentProperty.square_feet} sqft</Badge>
                  )}
                  {currentProperty.bedrooms && (
                    <Badge variant="secondary" className="text-[10px]">{currentProperty.bedrooms} quartos</Badge>
                  )}
                  {currentProperty.bathrooms && (
                    <Badge variant="secondary" className="text-[10px]">{currentProperty.bathrooms} banheiros</Badge>
                  )}
                  {currentProperty.batch_name && (
                    <Badge variant="outline" className="text-[10px]">{currentProperty.batch_name}</Badge>
                  )}
                </div>
                {/* External Links */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentProperty.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    Maps
                  </a>
                  <a
                    href={`https://www.zillow.com/homes/${encodeURIComponent(currentProperty.address)}_rb/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <span className="font-bold">Z</span>
                    Zillow
                  </a>
                  <a
                    href={`https://www.trulia.com/homes/${encodeURIComponent(currentProperty.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold hover:bg-green-100 transition-colors"
                  >
                    <span className="font-bold">T</span>
                    Trulia
                  </a>
                  <a
                    href={`https://www.redfin.com/search#query=${encodeURIComponent(currentProperty.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold hover:bg-red-100 transition-colors"
                  >
                    <span className="font-bold">R</span>
                    Redfin
                  </a>
                  <a
                    href={`https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(currentProperty.address.replace(/\s+/g, '-'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold hover:bg-orange-100 transition-colors"
                  >
                    <span className="font-bold">Re</span>
                    Realtor
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-muted rounded-lg p-3 sm:p-4">
                  <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Valor Estimado</p>
                  <p className="text-base sm:text-xl font-bold">
                    ${currentProperty.estimated_value?.toLocaleString() || "N/A"}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-3 sm:p-4">
                  <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Oferta</p>
                  <p className="text-base sm:text-xl font-bold">
                    ${currentProperty.cash_offer_amount?.toLocaleString() || "N/A"}
                  </p>
                </div>
              </div>

              {/* Keyboard Shortcuts Help - hidden on mobile */}
              <div className="hidden sm:block bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Keyboard className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900 text-sm">Atalhos de Teclado</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border rounded text-xs">A</kbd>
                    <span>Aprovar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border rounded text-xs">R</kbd>
                    <span>Rejeitar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border rounded text-xs">→</kbd>
                    <span>Próxima</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border rounded text-xs">←</kbd>
                    <span>Anterior</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="text-xs sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">Ant.</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="px-3 sm:px-8 text-xs sm:text-sm"
            >
              Revisar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === properties.length - 1}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Próxima</span>
              <span className="sm:hidden">Próx.</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      {currentProperty && (
        <PropertyApprovalDialog
          propertyId={currentProperty.id}
          propertyAddress={currentProperty.address}
          currentStatus={currentProperty.approval_status || undefined}
          onStatusChange={handleStatusChange}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </div>
  );
};
