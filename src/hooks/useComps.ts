/**
 * useComps - Shared hook for managing manual comps (add, delete, fetch, stats).
 * Eliminates duplication between CompsModal and MAOCalculator.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { detectSource, extractDataFromUrl } from '@/utils/urlDataExtractor';

export interface SavedComp {
  id: string;
  url: string;
  source: string;
  comp_data: {
    sale_price?: number;
    square_feet?: number;
  } | null;
  created_at: string;
}

interface CompProperty {
  id: string;
  address: string;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
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
      .from('manual_comps_links' as any)
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

  const addComp = useCallback(async (url: string, price: number, sqft: number) => {
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
        .from('manual_comps_links' as any)
        .insert([{
          property_address: addressStr,
          property_id: property.id,
          url: url.trim(),
          source: detectSource(url),
          comp_data: { sale_price: price, square_feet: sqft },
          user_id: user.id,
        }]);

      if (error) throw error;

      toast({ title: 'Comp adicionado!', description: `$${price.toLocaleString()} | ${sqft} sqft` });
      await fetchComps();
      return true;
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [property, fetchComps, toast]);

  const deleteComp = useCallback(async (compId: string) => {
    try {
      const { error } = await supabase
        .from('manual_comps_links' as any)
        .delete()
        .eq('id', compId);

      if (error) throw error;
      setComps(prev => prev.filter(c => c.id !== compId));
      toast({ title: 'Comp removido' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  const validComps = useMemo(
    () => comps.filter(c => c.comp_data?.sale_price && c.comp_data?.square_feet && c.comp_data.square_feet > 0),
    [comps],
  );

  const avgPricePerSqft = useMemo(() => {
    if (validComps.length === 0) return 0;
    const total = validComps.reduce((sum, c) => sum + (c.comp_data!.sale_price! / c.comp_data!.square_feet!), 0);
    return Math.round(total / validComps.length);
  }, [validComps]);

  return {
    comps,
    validComps,
    avgPricePerSqft,
    loading,
    saving,
    addComp,
    deleteComp,
    fetchComps,
  };
}
