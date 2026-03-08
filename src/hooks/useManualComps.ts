/**
 * useManualComps - Hook for managing manual comps links CRUD
 * Extracted from ManualCompsManager (1505 lines → hook)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { extractDataFromUrl, formatExtractedAddress, isValidExtractedData } from '@/utils/urlDataExtractor';

export interface SavedCompsLink {
  id: string;
  property_address: string;
  property_id?: string | null;
  url: string;
  source: 'trulia' | 'zillow' | 'redfin' | 'realtor' | 'other';
  notes?: string | null;
  comp_data?: {
    sale_price?: number;
    square_feet?: number;
    bedrooms?: number;
    bathrooms?: number;
    sale_date?: string;
  } | null;
  created_at: string;
  user_id?: string;
}

export interface CompsProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value?: number;
  cash_offer_amount?: number;
  square_feet?: number;
}

export interface CompFormState {
  selectedPropertyId: string;
  propertyAddress: string;
  compsUrl: string;
  notes: string;
  salePrice: string;
  squareFeet: string;
  bedrooms: string;
  bathrooms: string;
  saleDate: string;
  editingLinkId: string | null;
  showBulkAdd: boolean;
  bulkUrls: string;
}

const initialFormState: Omit<CompFormState, 'selectedPropertyId' | 'propertyAddress'> = {
  compsUrl: '',
  notes: '',
  salePrice: '',
  squareFeet: '',
  bedrooms: '',
  bathrooms: '',
  saleDate: '',
  editingLinkId: null,
  showBulkAdd: false,
  bulkUrls: '',
};

export function detectSource(url: string): SavedCompsLink['source'] {
  if (url.includes('trulia.com')) return 'trulia';
  if (url.includes('zillow.com')) return 'zillow';
  if (url.includes('redfin.com')) return 'redfin';
  if (url.includes('realtor.com')) return 'realtor';
  return 'other';
}

export function useManualComps(
  preSelectedPropertyId?: string,
  preSelectedProperty?: CompsProperty,
  onLinkAdded?: () => void,
) {
  const { toast } = useToast();
  const [properties, setProperties] = useState<CompsProperty[]>([]);
  const [savedLinks, setSavedLinks] = useState<SavedCompsLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterPropertyId, setFilterPropertyId] = useState<string>('all');
  const [form, setForm] = useState<CompFormState>({
    selectedPropertyId: '',
    propertyAddress: '',
    ...initialFormState,
  });

  const updateForm = useCallback((partial: Partial<CompFormState>) => {
    setForm(prev => ({ ...prev, ...partial }));
  }, []);

  const resetForm = useCallback((keepProperty = false) => {
    setForm(prev => ({
      ...prev,
      ...initialFormState,
      ...(keepProperty ? {} : { selectedPropertyId: '', propertyAddress: '' }),
    }));
  }, []);

  // Load properties
  const loadProperties = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, city, state, zip_code, estimated_value, cash_offer_amount, square_feet')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  }, []);

  // Load saved links
  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSavedLinks([]); return; }

      const { data, error } = await supabase
        .from('manual_comps_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedLinks((data as unknown as SavedCompsLink[]) || []);
    } catch (error) {
      console.error('Error loading links:', error);
      toast({ title: '❌ Erro ao carregar', description: 'Não foi possível carregar os links salvos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Select property handler
  const handlePropertySelect = useCallback((propertyId: string) => {
    updateForm({ selectedPropertyId: propertyId });
    if (propertyId === 'manual') {
      updateForm({ propertyAddress: '' });
      return;
    }
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      updateForm({ propertyAddress: `${property.address}, ${property.city}, ${property.state} ${property.zip_code}` });
    }
  }, [properties, updateForm]);

  // Build comp_data object
  const buildCompData = useCallback(() => {
    const priceNum = parseFloat(form.salePrice);
    const sqftNum = parseFloat(form.squareFeet);
    if (!priceNum || priceNum <= 0 || !sqftNum || sqftNum <= 0) return null;
    return {
      sale_price: priceNum,
      square_feet: sqftNum,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : undefined,
      sale_date: form.saleDate || undefined,
    };
  }, [form]);

  // Resolve property address
  const resolveAddress = useCallback(() => {
    let addr = form.propertyAddress.trim();
    if (!addr && preSelectedProperty) {
      addr = `${preSelectedProperty.address}, ${preSelectedProperty.city}, ${preSelectedProperty.state} ${preSelectedProperty.zip_code}`;
    }
    if (!addr && preSelectedPropertyId) {
      const p = properties.find(p => p.id === preSelectedPropertyId);
      if (p) addr = `${p.address}, ${p.city}, ${p.state} ${p.zip_code}`;
    }
    return addr;
  }, [form.propertyAddress, preSelectedProperty, preSelectedPropertyId, properties]);

  // Save link
  const handleSaveLink = useCallback(async () => {
    if (!preSelectedPropertyId && !form.propertyAddress.trim()) {
      toast({ title: '⚠️ Endereço necessário', variant: 'destructive' });
      return;
    }
    if (!form.compsUrl.trim()) {
      toast({ title: '⚠️ URL necessário', variant: 'destructive' });
      return;
    }
    try { new URL(form.compsUrl); } catch {
      toast({ title: '⚠️ URL inválido', variant: 'destructive' });
      return;
    }

    const compData = buildCompData();
    if (!compData) {
      toast({ title: '⚠️ Dados incompletos', description: 'Preencha preço e sqft', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: '⚠️ Não autenticado', variant: 'destructive' }); return; }

      const { error } = await supabase
        .from('manual_comps_links')
        .insert([{
          property_address: resolveAddress(),
          property_id: form.selectedPropertyId && form.selectedPropertyId !== 'manual' ? form.selectedPropertyId : null,
          url: form.compsUrl.trim(),
          source: detectSource(form.compsUrl),
          notes: form.notes.trim() || null,
          comp_data: compData,
          user_id: user.id,
        }]);
      if (error) throw error;

      toast({ title: '✅ Link salvo!' });
      onLinkAdded?.();
      resetForm(true);
      loadLinks();
    } catch (error) {
      console.error('Error saving link:', error);
      toast({ title: '❌ Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [form, preSelectedPropertyId, buildCompData, resolveAddress, resetForm, loadLinks, onLinkAdded, toast]);

  // Update link
  const handleUpdateLink = useCallback(async () => {
    if (!form.editingLinkId) return;
    const compData = buildCompData();
    if (!compData) {
      toast({ title: '⚠️ Dados incompletos', description: 'Preencha preço e sqft', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: '⚠️ Não autenticado', variant: 'destructive' }); return; }

      const { error } = await supabase
        .from('manual_comps_links')
        .update({ url: form.compsUrl.trim(), notes: form.notes.trim() || null, comp_data: compData })
        .eq('id', form.editingLinkId)
        .eq('user_id', user.id);
      if (error) throw error;

      toast({ title: '✅ Link atualizado!' });
      onLinkAdded?.();
      resetForm(true);
      loadLinks();
    } catch (error) {
      console.error('Error updating link:', error);
      toast({ title: '❌ Erro ao atualizar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [form, buildCompData, resetForm, loadLinks, onLinkAdded, toast]);

  // Edit link
  const startEdit = useCallback((link: SavedCompsLink) => {
    updateForm({
      editingLinkId: link.id,
      compsUrl: link.url,
      notes: link.notes || '',
      salePrice: link.comp_data?.sale_price?.toString() || '',
      squareFeet: link.comp_data?.square_feet?.toString() || '',
      bedrooms: link.comp_data?.bedrooms?.toString() || '',
      bathrooms: link.comp_data?.bathrooms?.toString() || '',
      saleDate: link.comp_data?.sale_date || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({ title: '✏️ Modo de edição' });
  }, [updateForm, toast]);

  const cancelEdit = useCallback(() => {
    resetForm(true);
    toast({ title: '❌ Edição cancelada' });
  }, [resetForm, toast]);

  // Delete link
  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('manual_comps_links').delete().eq('id', id);
      if (error) throw error;
      toast({ title: '🗑️ Link removido' });
      loadLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({ title: '❌ Erro ao remover', variant: 'destructive' });
    }
  }, [loadLinks, toast]);

  // Bulk add
  const handleBulkAdd = useCallback(async () => {
    if (!form.selectedPropertyId || form.selectedPropertyId === 'manual') {
      toast({ title: '⚠️ Selecione uma propriedade', variant: 'destructive' });
      return;
    }
    const urls = form.bulkUrls.split('\n').map(u => u.trim())
      .filter(u => u.length > 0 && (u.includes('zillow') || u.includes('trulia') || u.includes('redfin') || u.includes('realtor')));
    if (urls.length === 0) {
      toast({ title: '⚠️ Nenhuma URL válida', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }

      for (const url of urls) {
        try {
          const extracted = extractDataFromUrl(url);
          const addressStr = formatExtractedAddress(extracted);
          let compData = null;
          if (extracted.price || extracted.sqft) {
            compData = { salePrice: extracted.price, squareFeet: extracted.sqft, bedrooms: extracted.beds, bathrooms: extracted.baths };
          }
          await supabase.from('manual_comps_links').insert({
            property_address: form.propertyAddress,
            property_id: form.selectedPropertyId,
            url, source: detectSource(url),
            notes: `Bulk add - ${addressStr || 'Auto detected'}`,
            comp_data: compData, user_id: user.id,
          });
          await new Promise(r => setTimeout(r, 200));
        } catch {}
      }

      loadLinks();
      updateForm({ bulkUrls: '', showBulkAdd: false });
      toast({ title: '✅ Comps adicionados!', description: `${urls.length} URLs processadas` });
      onLinkAdded?.();
    } catch (error) {
      console.error('Bulk add error:', error);
      toast({ title: '❌ Erro no bulk add', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [form, loadLinks, updateForm, onLinkAdded, toast]);

  // Auto-fill from URL
  const handleAutoFill = useCallback(() => {
    try {
      const extracted = extractDataFromUrl(form.compsUrl);
      const updates: Partial<CompFormState> = {};
      if (extracted.price) updates.salePrice = extracted.price.toString();
      if (extracted.sqft) updates.squareFeet = extracted.sqft.toString();
      if (extracted.beds) updates.bedrooms = extracted.beds.toString();
      if (extracted.baths) updates.bathrooms = extracted.baths.toString();
      updateForm(updates);
      toast({ title: '✅ Dados extraídos!', description: formatExtractedAddress(extracted) || 'Informações preenchidas' });
    } catch {
      toast({ title: '⚠️ Não foi possível extrair', variant: 'destructive' });
    }
  }, [form.compsUrl, updateForm, toast]);

  // Copy link
  const handleCopyLink = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: '📋 Copiado!' });
  }, [toast]);

  // Filtered links
  const getFilteredLinks = useCallback(() => {
    if (filterPropertyId === 'all') return savedLinks;
    return savedLinks.filter(link => link.property_id === filterPropertyId);
  }, [savedLinks, filterPropertyId]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && form.compsUrl && !saving) {
        e.preventDefault();
        handleSaveLink();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        updateForm({ showBulkAdd: !form.showBulkAdd });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form.compsUrl, form.showBulkAdd, saving, handleSaveLink, updateForm]);

  // Initial load
  useEffect(() => { loadProperties(); loadLinks(); }, []);

  // Pre-select property
  useEffect(() => {
    if (preSelectedProperty) {
      const addr = `${preSelectedProperty.address}, ${preSelectedProperty.city}, ${preSelectedProperty.state} ${preSelectedProperty.zip_code}`;
      updateForm({ selectedPropertyId: preSelectedProperty.id, propertyAddress: addr });
      setFilterPropertyId(preSelectedProperty.id);
    }
  }, [preSelectedProperty]);

  useEffect(() => {
    if (preSelectedPropertyId && !preSelectedProperty && properties.length > 0) {
      const p = properties.find(p => p.id === preSelectedPropertyId);
      if (p) {
        const addr = `${p.address}, ${p.city}, ${p.state} ${p.zip_code}`;
        updateForm({ selectedPropertyId: preSelectedPropertyId, propertyAddress: addr });
        setFilterPropertyId(preSelectedPropertyId);
      }
    }
  }, [preSelectedPropertyId, preSelectedProperty, properties]);

  return {
    properties,
    savedLinks,
    loading,
    saving,
    form,
    updateForm,
    filterPropertyId,
    setFilterPropertyId,
    handlePropertySelect,
    handleSaveLink,
    handleUpdateLink,
    startEdit,
    cancelEdit,
    handleDelete,
    handleBulkAdd,
    handleAutoFill,
    handleCopyLink,
    getFilteredLinks,
  };
}
