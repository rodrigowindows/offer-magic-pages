/**
 * Hook for ReviewQueue data fetching, filtering, and navigation.
 * Extracted from ReviewQueue.tsx for better separation of concerns.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import type { QueueProperty, StatusFilter, DailyStats, StatusCounts } from '@/components/review/types';
import type { SavedComp } from '@/hooks/useComps';
import { getVisualCategory, countByVisual } from '@/components/review/helpers';

const PROPERTY_FIELDS = "id, address, city, state, zip_code, neighborhood, owner_name, property_image_url, estimated_value, cash_offer_amount, approval_status, approved_by_name, approved_at, rejection_reason, rejection_notes, decision_photos, property_type, year_built, square_feet, bedrooms, bathrooms, lot_size, owner_phone, lead_score, zillow_url, focar, evaluation, tags, owner_address, origem, ai_score, ai_reasoning, mao, total_tax_due, years_delinquent, taxable_value, arv, avg_price_per_sqft, dnc_flag, deceased, wholesale_value, wholesale_pct, renovation_value, renovation_pct, email1, email2";

export const useReviewQueue = (selectedBatch?: string) => {
  const [properties, setProperties] = useState<QueueProperty[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [visualFilter, setVisualFilter] = useState<string>('all');
  const [smartFilter, setSmartFilter] = useState<string>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ pending: 0, approved: 0, rejected: 0 });

  // Comps
  const [currentCompsCount, setCurrentCompsCount] = useState(0);
  const [currentComps, setCurrentComps] = useState<SavedComp[]>([]);

  const { user, userId } = useCurrentUser();
  const { toast } = useToast();

  // Derived
  const visualCounts = countByVisual(properties);
  // Smart filter: "Ready to Contact"
  const isReadyToContact = useCallback((p: QueueProperty): boolean => {
    const hasContact = !!(p.owner_phone || p.email1 || p.email2);
    const hasCompleteData = !!(p.address && p.square_feet && p.year_built && p.estimated_value && p.cash_offer_amount);
    const hasPositiveAI = (p.ai_score ?? 0) >= 5;
    const notBlocked = !p.dnc_flag && !p.deceased;
    return hasContact && hasCompleteData && hasPositiveAI && notBlocked;
  }, []);

  const readyToContactCount = useMemo(() =>
    properties.filter(isReadyToContact).length,
    [properties, isReadyToContact]
  );

  const searchFiltered = searchQuery.trim()
    ? properties.filter(p => p.address.toLowerCase().includes(searchQuery.toLowerCase()))
    : properties;
  const smartFiltered = smartFilter === 'ready'
    ? searchFiltered.filter(isReadyToContact)
    : searchFiltered;
  const filteredProperties = visualFilter === 'all'
    ? smartFiltered
    : smartFiltered.filter(p => getVisualCategory(p.evaluation) === visualFilter);
  const currentProperty = filteredProperties[currentIndex];

  const avgCompPrice = useMemo(() => {
    if (currentComps.length === 0) return null;
    const sorted = [...currentComps].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const recent3 = sorted.slice(0, 3);
    const prices = recent3
      .map(c => c.comp_data?.sale_price)
      .filter((p): p is number => typeof p === 'number' && p > 0);
    return prices.length > 0 ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : null;
  }, [currentComps]);

  // ── Smart sorting ──────────────────────────────────────────────

  /**
   * Compute a composite priority score (higher = better lead).
   * - Data completeness (0-50 pts): key fields present
   * - AI Score (0-30 pts): normalized from ai_score (1-10 → 3-30)
   * - Contact availability (0-20 pts): phone/email presence
   */
  const computeLeadScore = useCallback((p: QueueProperty): number => {
    let score = 0;

    // Data completeness (0-50)
    const fields = [
      p.address, p.city, p.state, p.zip_code,
      p.estimated_value, p.cash_offer_amount,
      p.square_feet, p.year_built, p.bedrooms, p.bathrooms,
    ];
    const filled = fields.filter(f => f != null && f !== '' && f !== 0).length;
    score += (filled / fields.length) * 50;

    // AI Score (0-30)
    if (p.ai_score && p.ai_score > 0) {
      score += Math.min(p.ai_score, 10) * 3;
    }

    // Contact data (0-20)
    if (p.owner_name) score += 5;
    if (p.owner_phone) score += 10;
    if (p.owner_address) score += 5;

    return score;
  }, []);

  // ── Data fetching ─────────────────────────────────────────────

  const fetchProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("properties")
        .select(PROPERTY_FIELDS)
        .order("created_at", { ascending: true })
        .limit(500);

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

      // Smart sort: best leads first (highest composite score)
      const raw = (data as unknown as QueueProperty[]) || [];
      const sorted = [...raw].sort((a, b) => computeLeadScore(b) - computeLeadScore(a));
      setProperties(sorted);
    } catch (error: any) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, selectedBatch, toast, computeLeadScore]);

  const fetchStatusCounts = useCallback(async () => {
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
  }, [selectedBatch]);

  const fetchDailyStats = useCallback(async () => {
    if (!user) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: userReviews } = await supabase
        .from("properties")
        .select("approval_status")
        .eq("approved_by", user.id)
        .gte("approved_at", today.toISOString());

      const approved = userReviews?.filter(p => p.approval_status === "approved").length || 0;
      const rejected = userReviews?.filter(p => p.approval_status === "rejected").length || 0;
      setDailyStats({
        reviewed_today: approved + rejected,
        approved_today: approved,
        rejected_today: rejected,
      });
    } catch (error: any) {
      console.error("Error fetching daily stats:", error);
    }
  }, [user]);

  const fetchCurrentComps = useCallback(async (propertyId: string) => {
    try {
      const { data } = await supabase
        .from('manual_comps_links' as any)
        .select('id, url, source, comp_data, created_at')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      const comps = (data as unknown as SavedComp[]) || [];
      setCurrentComps(comps);
      setCurrentCompsCount(comps.length);
    } catch {
      setCurrentComps([]);
      setCurrentCompsCount(0);
    }
  }, []);

  // ── Effects ───────────────────────────────────────────────────

  useEffect(() => {
    fetchProperties();
    if (user) {
      fetchDailyStats();
      fetchStatusCounts();
    }
  }, [user, selectedBatch, statusFilter, fetchProperties, fetchDailyStats, fetchStatusCounts]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('properties-approval-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'properties' },
        (payload: any) => {
          if (payload.new?.approved_by && payload.new.approved_by !== userId) {
            fetchProperties();
            fetchStatusCounts();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, selectedBatch, statusFilter, fetchProperties, fetchStatusCounts]);

  useEffect(() => { setCurrentIndex(0); }, [visualFilter, statusFilter, searchQuery, smartFilter]);

  useEffect(() => {
    if (currentProperty?.id) fetchCurrentComps(currentProperty.id);
  }, [currentProperty?.id, fetchCurrentComps]);

  // ── Navigation ────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (currentIndex < filteredProperties.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast({ title: "Fim da lista", description: "Você chegou ao final das propriedades filtradas." });
    }
  }, [currentIndex, filteredProperties.length, toast]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  return {
    // Data
    properties, currentProperty, filteredProperties, isLoading,
    dailyStats, statusCounts, visualCounts, readyToContactCount,
    currentComps, currentCompsCount, avgCompPrice,
    currentIndex,
    // Filters
    statusFilter, setStatusFilter,
    visualFilter, setVisualFilter,
    smartFilter, setSmartFilter,
    searchQuery, setSearchQuery,
    // Actions
    fetchProperties, fetchDailyStats, fetchStatusCounts, fetchCurrentComps,
    handleNext, handlePrevious,
  };
};
