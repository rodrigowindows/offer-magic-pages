/**
 * useComps - Shared hook for managing manual comps (add, delete, fetch, stats).
 * Supports expanded comp_data fields for Step 4.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { detectSource } from '@/utils/urlDataExtractor';
import { calculateCompsPricing } from '@/services/compsPricing';

export interface CompData {
  sale_price?: number;
  square_feet?: number;
  lot_size?: number;
  bedrooms?: number;
  bathrooms?: number;
  sale_date?: string;
  address?: string;
}

export interface SavedComp {
  id: string;
  url: string;
  source: string;
  comp_data: CompData | null;
  created_at: string;
}

interface CompProperty {
  id: string;
  address: string;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  square_feet?: number | null;
}

export function useComps(property: CompProperty | null, enabled = true) {
  const [comps, setComps] = useState<SavedComp[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchComps = useCallback(async () => {
    if (!property) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('manual_comps_links')
      .select('id, url, source, comp_data, created_at')
      .eq('property_id', property.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comps:', error);
    } else {
      setComps((data as unknown as SavedComp[]) || []);
    }
    setLoading(false);
  }, [property?.id]);

  useEffect(() => {
    if (enabled && property) fetchComps();
  }, [property?.id, enabled]);

  const addComp = useCallback(async (url: string, compData: CompData) => {
    if (!property) return false;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Nao autenticado', variant: 'destructive' });
        return false;
      }

      const addressStr = `${property.address}, ${property.city || ''}, ${property.state || ''} ${property.zip_code || ''}`;

      const { error } = await supabase
        .from('manual_comps_links')
        .insert([{
          property_address: addressStr,
          property_id: property.id,
          url: url.trim(),
          source: detectSource(url),
          comp_data: compData as unknown as Record<string, unknown>,
          user_id: user.id,
        }]);

      if (error) throw error;

      toast({
        title: 'Comp adicionado!',
        description: `$${(compData.sale_price || 0).toLocaleString()} | ${compData.square_feet || 0} sqft`,
      });
      await fetchComps();
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [property, fetchComps, toast]);

  const deleteComp = useCallback(async (compId: string) => {
    try {
      const { error } = await supabase
        .from('manual_comps_links')
        .delete()
        .eq('id', compId);

      if (error) throw error;
      setComps(prev => prev.filter(c => c.id !== compId));
      toast({ title: 'Comp removido' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    }
  }, [toast]);

  const pricing = useMemo(
    () => calculateCompsPricing(
      comps.map(c => c.comp_data || {}),
      property?.square_feet || 0,
    ),
    [comps, property?.square_feet],
  );

  // Backward compat
  const validComps = useMemo(
    () => comps.filter(c => c.comp_data?.sale_price && c.comp_data?.square_feet && c.comp_data.square_feet > 0),
    [comps],
  );

  return {
    comps,
    validComps,
    avgPricePerSqft: pricing.avgPricePerSqft,
    pricing,
    loading,
    saving,
    addComp,
    deleteComp,
    fetchComps,
  };
}
