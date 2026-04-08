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

const PROPERTY_FIELDS = "id, address, city, state, zip_code, neighborhood, owner_name, property_image_url, estimated_value, cash_offer_amount, approval_status, approved_by_name, approved_at, rejection_reason, rejection_notes, decision_photos, property_type, year_built, square_feet, bedrooms, bathrooms, lot_size, owner_phone, lead_score, zillow_url, focar, evaluation, tags, owner_address, origem, ai_score, ai_reasoning, mao, total_tax_due, years_delinquent, taxable_value, arv, avg_price_per_sqft, dnc_flag, deceased, wholesale_value, wholesale_pct, renovation_value, renovation_pct";

export const useReviewQueue = (selectedBatch?: string) => {
  const [properties, setProperties] = useState<QueueProperty[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [visualFilter, setVisualFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ pending: 0, approved: 0, rejected: 0 });

  // Comps
  const [currentCompsCount, setCurrentCompsCount] = useState(0);
  const [currentComps, setCurrentComps] = useState<SavedComp[]>([]);

  const { user, userId } = useCurrentUser();
  const { toast } = useToast();

  // Derived
  const visualCounts = countByVisual(properties);
  const hasContact = (p: QueueProperty) => !!(p.owner_phone || (p as any).pref_phone_1 || (p as any).pref_email_1);
  const contactCount = properties.filter(hasContact).length;
  const searchFiltered = searchQuery.trim()
    ? properties.filter(p => p.address.toLowerCase().includes(searchQuery.toLowerCase()))
    : properties;
  const visualFiltered = visualFilter === 'all'
    ? searchFiltered
    : visualFilter === 'CONTACT'
    ? searchFiltered.filter(hasContact)
    : searchFiltered.filter(p => getVisualCategory(p.evaluation) === visualFilter);

  // Smart sorting: has contact data first → highest AI score → most complete data
  const filteredProperties = useMemo(() => {
    if (statusFilter !== 'pending') return visualFiltered; // don't re-sort approved/rejected
    return [...visualFiltered].sort((a, b) => {
      // 1. Properties with contact data first
      const aHasContact = !!(a.owner_phone || (a as any).pref_phone_1 || (a as any).pref_email_1);
      const bHasContact = !!(b.owner_phone || (b as any).pref_phone_1 || (b as any).pref_email_1);
      if (aHasContact !== bHasContact) return bHasContact ? 1 : -1;

      // 2. Higher AI score first
      const aScore = a.ai_score ?? 0;
      const bScore = b.ai_score ?? 0;
      if (aScore !== bScore) return bScore - aScore;

      // 3. More complete data first
      const completeness = (p: QueueProperty) => {
        let c = 0;
        if (p.estimated_value) c++;
        if (p.square_feet) c++;
        if (p.bedrooms) c++;
        if (p.bathrooms) c++;
        if (p.year_built) c++;
        if (p.property_type) c++;
        if (p.lot_size) c++;
        if (p.owner_name) c++;
        if (p.property_image_url) c++;
        if (p.cash_offer_amount) c++;
        return c;
      };
      return completeness(b) - completeness(a);
    });
  }, [visualFiltered, statusFilter]);

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
      setProperties((data as unknown as QueueProperty[]) || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, selectedBatch, toast]);

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

  useEffect(() => { setCurrentIndex(0); }, [visualFilter, statusFilter, searchQuery]);

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
    dailyStats, statusCounts, visualCounts, contactCount,
    currentComps, currentCompsCount, avgCompPrice,
    currentIndex,
    // Filters
    statusFilter, setStatusFilter,
    visualFilter, setVisualFilter,
    searchQuery, setSearchQuery,
    // Actions
    fetchProperties, fetchDailyStats, fetchStatusCounts, fetchCurrentComps,
    handleNext, handlePrevious,
  };
};
