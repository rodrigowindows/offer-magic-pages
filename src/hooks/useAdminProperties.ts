import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { LeadStatus } from '@/components/lead/LeadStatusBadge';
import type { PropertyFilters as AdvancedFilters } from '@/components/shared/AdvancedPropertyFilters';
import type { ContactFilters } from '@/components/shared/ContactAvailabilityFilter';

export interface AdminProperty {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_image_url: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  status: string;
  lead_status: LeadStatus;
  created_at: string;
  sms_sent: boolean;
  email_sent: boolean;
  letter_sent: boolean;
  card_sent: boolean;
  phone_call_made: boolean;
  meeting_scheduled: boolean;
  owner_address?: string;
  owner_name?: string;
  owner_phone?: string;
  phone1?: string;
  phone2?: string;
  email1?: string;
  email2?: string;
  answer_flag?: boolean;
  dnc_flag?: boolean;
  neighborhood?: string;
  origem?: string;
  carta?: string;
  zillow_url?: string;
  evaluation?: string;
  focar?: string;
  comparative_price?: number;
  approval_status?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  rejection_notes?: string;
  updated_by?: string;
  updated_by_name?: string;
  airbnb_eligible?: boolean;
  airbnb_regulations?: any;
  airbnb_notes?: string;
  airbnb_check_date?: string;
  tags?: string[];
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: number;
  year_built?: number;
  county?: string;
  property_type?: string;
  import_batch?: string;
  import_date?: string;
  last_contact_date?: string;
  next_followup_date?: string;
  lead_score?: number;
}

export interface AdminFiltersState {
  searchQuery: string;
  filterStatus: LeadStatus | 'all';
  approvalStatus: string;
  selectedTags: string[];
  advancedFilters: AdvancedFilters;
  priceRange: [number, number];
  selectedCities: string[];
  dateFilter: string;
  filterUserId: string | null;
  filterUserName: string | null;
  contactFilters: ContactFilters;
}

const hasContactInfo = (p: AdminProperty, type: 'phone' | 'email' | 'preferred' | 'skipPhone' | 'skipEmail' | 'noSkip') => {
  const tags = Array.isArray(p.tags) ? p.tags : [];
  
  switch (type) {
    case 'phone': {
      const hasPref = tags.some((t: string) => t.startsWith('pref_phone:'));
      const hasManual = tags.some((t: string) => t.startsWith('manual_phone:'));
      const hasP1 = p.phone1 && p.phone1.trim().length > 0;
      const hasP2 = (p as any).phone2 && (p as any).phone2.trim().length > 0;
      return hasPref || hasManual || hasP1 || hasP2;
    }
    case 'email': {
      const hasPref = tags.some((t: string) => t.startsWith('pref_email:'));
      const hasManual = tags.some((t: string) => t.startsWith('manual_email:'));
      const hasE1 = (p as any).email1 && (p as any).email1.trim().length > 0;
      const hasE2 = (p as any).email2 && (p as any).email2.trim().length > 0;
      return hasPref || hasManual || hasE1 || hasE2;
    }
    case 'preferred':
      return tags.some((t: string) => t.startsWith('pref_phone:') || t.startsWith('pref_email:'));
    case 'skipPhone':
      return p.phone1 || (p as any).phone2 || (p as any).phone3 || (p as any).phone4 || (p as any).phone5 || (p as any).phone6 || (p as any).phone7;
    case 'skipEmail':
      return (p as any).email1 || (p as any).email2 || (p as any).email3 || (p as any).email4 || (p as any).email5;
    case 'noSkip': {
      const hasAny = tags.some((t: string) => 
        t.startsWith('pref_phone:') || t.startsWith('pref_email:') || t.startsWith('manual_phone:') || t.startsWith('manual_email:')
      ) || p.phone1 || (p as any).phone2 || (p as any).email1 || (p as any).email2;
      return !!hasAny;
    }
    default:
      return false;
  }
};

export const useAdminProperties = () => {
  const { toast } = useToast();
  const { userId, userName } = useCurrentUser();
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  // Filters
  const [filters, setFilters] = useState<AdminFiltersState>({
    searchQuery: '',
    filterStatus: 'all',
    approvalStatus: 'all',
    selectedTags: [],
    advancedFilters: {},
    priceRange: [0, 1000000],
    selectedCities: [],
    dateFilter: 'all',
    filterUserId: null,
    filterUserName: null,
    contactFilters: {},
  });

  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  const updateFilter = useCallback(<K extends keyof AdminFiltersState>(key: K, value: AdminFiltersState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      filterStatus: 'all',
      approvalStatus: 'all',
      selectedTags: [],
      advancedFilters: {},
      priceRange: [0, 1000000],
      selectedCities: [],
      dateFilter: 'all',
      filterUserId: null,
      filterUserName: null,
      contactFilters: {},
    });
  }, []);

  const fetchProperties = useCallback(async () => {
    setIsLoadingProperties(true);
    let query = supabase.from('properties').select('*');

    const af = filters.advancedFilters;
    if (af.city?.length) query = query.in('city', af.city);
    if (af.county?.length) query = query.in('county', af.county);
    if (af.propertyType?.length) query = query.in('property_type', af.propertyType);
    if (af.importBatch?.length) query = query.in('import_batch', af.importBatch);
    if (af.importDateFrom) query = query.gte('import_date', af.importDateFrom.toISOString().split('T')[0]);
    if (af.importDateTo) query = query.lte('import_date', af.importDateTo.toISOString().split('T')[0]);
    if (af.priceMin) query = query.gte('estimated_value', af.priceMin);
    if (af.priceMax) query = query.lte('estimated_value', af.priceMax);
    if (af.bedrooms) query = query.gte('bedrooms', af.bedrooms);
    if (af.bathrooms) query = query.gte('bathrooms', af.bathrooms);
    if (af.airbnbEligible !== undefined) query = query.eq('airbnb_eligible', af.airbnbEligible);
    if (af.hasImage !== undefined) {
      if (af.hasImage) query = query.not('property_image_url', 'is', null);
      else query = query.is('property_image_url', null);
    }
    if (filters.selectedTags.length > 0) query = query.contains('tags', filters.selectedTags);
    if (filters.approvalStatus !== 'all') query = query.eq('approval_status', filters.approvalStatus);
    if (filters.filterUserId) query = query.eq('approved_by', filters.filterUserId);
    if (filters.priceRange[0] > 0) query = query.gte('estimated_value', filters.priceRange[0]);
    if (filters.priceRange[1] < 1000000) query = query.lte('estimated_value', filters.priceRange[1]);
    if (filters.selectedCities.length > 0) query = query.in('city', filters.selectedCities);

    if (filters.dateFilter !== 'all') {
      const today = new Date();
      const days = { '7days': 7, '30days': 30, '90days': 90 }[filters.dateFilter];
      if (days) {
        const d = new Date(today);
        d.setDate(today.getDate() - days);
        query = query.gte('created_at', d.toISOString());
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load properties', variant: 'destructive' });
    } else {
      setProperties((data || []) as AdminProperty[]);
      if (data) {
        setStatusCounts({
          pending: data.filter((p: any) => p.approval_status === 'pending' || !p.approval_status).length,
          approved: data.filter((p: any) => p.approval_status === 'approved').length,
          rejected: data.filter((p: any) => p.approval_status === 'rejected').length,
        });
      }
    }
    setIsLoadingProperties(false);
  }, [filters, toast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Client-side filtering
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        if (![p.address, p.city, p.owner_name, p.zip_code].some(v => v?.toLowerCase().includes(q))) return false;
      }
      if (filters.filterStatus !== 'all' && p.lead_status !== filters.filterStatus) return false;
      if (filters.approvalStatus !== 'all' && p.approval_status !== filters.approvalStatus) return false;
      if (filters.filterUserId && (p as any).approved_by !== filters.filterUserId) return false;

      const af = filters.advancedFilters;
      if (af.noPhoneNumber && hasContactInfo(p, 'phone')) return false;
      if (af.noEmail && hasContactInfo(p, 'email')) return false;
      if (af.noSkipTrace && hasContactInfo(p, 'noSkip')) return false;

      const cf = filters.contactFilters;
      if (cf.hasPhone && !hasContactInfo(p, 'phone')) return false;
      if (cf.hasEmail && !hasContactInfo(p, 'email')) return false;
      if (cf.hasPreferredContacts && !hasContactInfo(p, 'preferred')) return false;
      if (cf.hasSkiptracePhones && !hasContactInfo(p, 'skipPhone')) return false;
      if (cf.hasSkiptraceEmails && !hasContactInfo(p, 'skipEmail')) return false;
      if (cf.noSkiptraceData && hasContactInfo(p, 'noSkip')) return false;

      return true;
    });
  }, [properties, filters]);

  const leadStatusCounts = useMemo(() => {
    return properties.reduce((acc, p) => {
      acc[p.lead_status] = (acc[p.lead_status] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [properties]);

  // CRUD operations
  const updatePropertyCommunication = useCallback(async (propertyId: string, field: string, value: boolean) => {
    const { error } = await supabase.from('properties').update({ [field]: value }).eq('id', propertyId);
    if (error) toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    else { toast({ title: 'Updated!' }); fetchProperties(); }
  }, [toast, fetchProperties]);

  const updateLeadStatus = useCallback(async (propertyId: string, newStatus: LeadStatus) => {
    const { error } = await supabase.from('properties').update({ lead_status: newStatus }).eq('id', propertyId);
    if (error) toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    else { toast({ title: 'Status updated!' }); fetchProperties(); }
  }, [toast, fetchProperties]);

  const handleBulkStatusChange = useCallback(async (newStatus: LeadStatus) => {
    const { error } = await supabase.from('properties').update({ lead_status: newStatus }).in('id', selectedProperties);
    if (error) toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    else { toast({ title: `Updated ${selectedProperties.length} properties` }); setSelectedProperties([]); fetchProperties(); }
  }, [selectedProperties, toast, fetchProperties]);

  const handleBulkDelete = useCallback(async () => {
    if (!confirm(`Delete ${selectedProperties.length} properties? This cannot be undone.`)) return;
    const { error } = await supabase.from('properties').delete().in('id', selectedProperties);
    if (error) toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    else { toast({ title: `Deleted ${selectedProperties.length} properties` }); setSelectedProperties([]); fetchProperties(); }
  }, [selectedProperties, toast, fetchProperties]);

  const handleMapApprove = useCallback(async (property: { id: string }) => {
    const { error } = await supabase.from('properties').update({
      approval_status: 'approved', approved_by: userId, approved_by_name: userName, approved_at: new Date().toISOString()
    } as any).eq('id', property.id);
    if (error) toast({ title: 'Erro', description: 'Falha ao aprovar', variant: 'destructive' });
    else { toast({ title: 'Aprovado' }); fetchProperties(); }
  }, [userId, userName, toast, fetchProperties]);

  const handleMapReject = useCallback(async (property: { id: string }) => {
    const { error } = await supabase.from('properties').update({
      approval_status: 'rejected', approved_by: userId, approved_by_name: userName, approved_at: new Date().toISOString()
    } as any).eq('id', property.id);
    if (error) toast({ title: 'Erro', description: 'Falha ao rejeitar', variant: 'destructive' });
    else { toast({ title: 'Rejeitado' }); fetchProperties(); }
  }, [userId, userName, toast, fetchProperties]);

  const togglePropertySelection = useCallback((propertyId: string) => {
    setSelectedProperties(prev => prev.includes(propertyId) ? prev.filter(id => id !== propertyId) : [...prev, propertyId]);
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedProperties(prev => prev.length === filteredProperties.length ? [] : filteredProperties.map(p => p.id));
  }, [filteredProperties]);

  return {
    properties,
    filteredProperties,
    isLoadingProperties,
    isLoading,
    setIsLoading,
    selectedProperties,
    setSelectedProperties,
    filters,
    updateFilter,
    clearAllFilters,
    statusCounts,
    leadStatusCounts,
    fetchProperties,
    updatePropertyCommunication,
    updateLeadStatus,
    handleBulkStatusChange,
    handleBulkDelete,
    handleMapApprove,
    handleMapReject,
    togglePropertySelection,
    toggleSelectAll,
    userId,
    userName,
  };
};
