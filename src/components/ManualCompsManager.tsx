/**
 * Manual Comps Manager - Opção Simples
 * Permite salvar links do Trulia, Zillow, Redfin, etc.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { extractDataFromUrl, formatExtractedAddress, isValidExtractedData } from '@/utils/urlDataExtractor';
import {
  Link,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle2,
  Loader2,
  Home,
  Filter,
  FileText,
  HelpCircle,
  Pencil
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface SavedCompsLink {
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

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value?: number;
  cash_offer_amount?: number;
}

interface ManualCompsManagerProps {
  preSelectedPropertyId?: string;
  onLinkAdded?: () => void;
}

export const ManualCompsManager = ({ preSelectedPropertyId, onLinkAdded }: ManualCompsManagerProps = {}) => {
  const { toast } = useToast();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [compsUrl, setCompsUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [savedLinks, setSavedLinks] = useState<SavedCompsLink[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterPropertyId, setFilterPropertyId] = useState<string>('all');

  // Estados para dados do comp (campos de preço/sqft sempre visíveis)
  const [salePrice, setSalePrice] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [addFullData, setAddFullData] = useState(false); // Para dados avançados opcionais (bedrooms, bathrooms, date)
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [saleDate, setSaleDate] = useState('');

  // Estado de edição
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  // Bulk Add states
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [recentlyAdded, setRecentlyAdded] = useState<Array<{url: string, address: string, price?: string}>>([]);

  // Carregar propriedades
  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, city, state, zip_code, estimated_value, cash_offer_amount')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  // Ao selecionar propriedade, preencher endereço
  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    if (propertyId === 'manual') {
      setPropertyAddress('');
      return;
    }
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setPropertyAddress(`${property.address}, ${property.city}, ${property.state} ${property.zip_code}`);
    }
  };

  // Detectar fonte do link
  const detectSource = (url: string): SavedCompsLink['source'] => {
    if (url.includes('trulia.com')) return 'trulia';
    if (url.includes('zillow.com')) return 'zillow';
    if (url.includes('redfin.com')) return 'redfin';
    if (url.includes('realtor.com')) return 'realtor';
    return 'other';
  };

  // Carregar links do Supabase
  const loadLinks = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setSavedLinks([]);
        return;
      }

      // Using explicit query since types may not be updated yet
      const { data, error } = await supabase
        .from('manual_comps_links' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedLinks((data as unknown as SavedCompsLink[]) || []);
    } catch (error) {
      console.error('Error loading links:', error);
      toast({
        title: '❌ Erro ao carregar',
        description: 'Não foi possível carregar os links salvos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar link no Supabase
  const handleSaveLink = async () => {
    if (!propertyAddress.trim()) {
      toast({
        title: '⚠️ Endereço necessário',
        description: 'Digite o endereço da propriedade',
        variant: 'destructive'
      });
      return;
    }

    if (!compsUrl.trim()) {
      toast({
        title: '⚠️ URL necessário',
        description: 'Cole o link da página de comps',
        variant: 'destructive'
      });
      return;
    }

    // Validar URL
    try {
      new URL(compsUrl);
    } catch {
      toast({
        title: '⚠️ URL inválido',
        description: 'Cole um link válido (exemplo: https://www.trulia.com/...)',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: '⚠️ Não autenticado',
          description: 'Faça login para salvar links',
          variant: 'destructive'
        });
        return;
      }

      // VALIDAÇÃO: Exigir pelo menos preço E sqft
      if (!salePrice || !squareFeet) {
        toast({
          title: '⚠️ Dados incompletos',
          description: 'Preencha tanto o preço quanto o sqft para salvar',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      const priceNum = parseFloat(salePrice);
      const sqftNum = parseFloat(squareFeet);

      if (priceNum <= 0 || isNaN(priceNum)) {
        toast({
          title: '⚠️ Preço inválido',
          description: 'O preço deve ser maior que zero',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      if (sqftNum <= 0 || isNaN(sqftNum)) {
        toast({
          title: '⚠️ Área inválida',
          description: 'O sqft deve ser maior que zero',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      // Preparar comp_data com dados validados
      const compData = {
        sale_price: priceNum,
        square_feet: sqftNum,
        bedrooms: addFullData && bedrooms ? parseInt(bedrooms) : undefined,
        bathrooms: addFullData && bathrooms ? parseFloat(bathrooms) : undefined,
        sale_date: addFullData && saleDate ? saleDate : undefined
      };

      const { error } = await supabase
        .from('manual_comps_links' as any)
        .insert([{
          property_address: propertyAddress.trim(),
          property_id: selectedPropertyId && selectedPropertyId !== 'manual' ? selectedPropertyId : null,
          url: compsUrl.trim(),
          source: detectSource(compsUrl),
          notes: notes.trim() || null,
          comp_data: compData,
          user_id: user.id
        }]);

      if (error) throw error;

      toast({
        title: '✅ Link salvo!',
        description: `Link de comps salvo para ${propertyAddress}`,
      });

      // Call callback to refresh manual links count
      onLinkAdded?.();

      // Limpar formulário MAS MANTER a propriedade selecionada para adicionar mais comps
      // setSelectedPropertyId(''); // ← NÃO limpar - manter selecionado
      // setPropertyAddress('');    // ← NÃO limpar - manter endereço
      setCompsUrl('');
      setNotes('');
      setSalePrice('');
      setSquareFeet('');
      setBedrooms('');
      setBathrooms('');
      setSaleDate('');
      setAddFullData(false);
      loadLinks();
    } catch (error) {
      console.error('Error saving link:', error);
      toast({
        title: '❌ Erro ao salvar',
        description: 'Não foi possível salvar o link',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Editar link existente
  const handleEditLink = (link: SavedCompsLink) => {
    setEditingLinkId(link.id);
    setCompsUrl(link.url);
    setNotes(link.notes || '');

    // Preencher dados se existirem
    if (link.comp_data) {
      setSalePrice(link.comp_data.sale_price?.toString() || '');
      setSquareFeet(link.comp_data.square_feet?.toString() || '');
      setBedrooms(link.comp_data.bedrooms?.toString() || '');
      setBathrooms(link.comp_data.bathrooms?.toString() || '');
      setSaleDate(link.comp_data.sale_date || '');

      // Ativar dados avançados se existirem
      if (link.comp_data.bedrooms || link.comp_data.bathrooms || link.comp_data.sale_date) {
        setAddFullData(true);
      }
    }

    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });

    toast({
      title: '✏️ Modo de edição',
      description: 'Faça as alterações e clique em "Atualizar"',
    });
  };

  // Atualizar link editado
  const handleUpdateLink = async () => {
    if (!editingLinkId) return;

    // VALIDAÇÃO: Exigir preço E sqft
    if (!salePrice || !squareFeet) {
      toast({
        title: '⚠️ Dados incompletos',
        description: 'Preencha tanto o preço quanto o sqft',
        variant: 'destructive'
      });
      return;
    }

    const priceNum = parseFloat(salePrice);
    const sqftNum = parseFloat(squareFeet);

    if (priceNum <= 0 || isNaN(priceNum)) {
      toast({
        title: '⚠️ Preço inválido',
        description: 'O preço deve ser maior que zero',
        variant: 'destructive'
      });
      return;
    }

    if (sqftNum <= 0 || isNaN(sqftNum)) {
      toast({
        title: '⚠️ Área inválida',
        description: 'O sqft deve ser maior que zero',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: '⚠️ Não autenticado',
          description: 'Faça login para atualizar',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      // Preparar comp_data com dados validados
      const compData = {
        sale_price: priceNum,
        square_feet: sqftNum,
        bedrooms: addFullData && bedrooms ? parseInt(bedrooms) : undefined,
        bathrooms: addFullData && bathrooms ? parseFloat(bathrooms) : undefined,
        sale_date: addFullData && saleDate ? saleDate : undefined
      };

      const { error } = await supabase
        .from('manual_comps_links' as any)
        .update({
          url: compsUrl.trim(),
          notes: notes.trim() || null,
          comp_data: compData
        })
        .eq('id', editingLinkId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: '✅ Link atualizado!',
        description: 'Alterações salvas com sucesso',
      });

      // Limpar formulário e sair do modo de edição
      setEditingLinkId(null);
      setCompsUrl('');
      setNotes('');
      setSalePrice('');
      setSquareFeet('');
      setBedrooms('');
      setBathrooms('');
      setSaleDate('');
      setAddFullData(false);

      onLinkAdded?.();
      loadLinks();
    } catch (error) {
      console.error('Error updating link:', error);
      toast({
        title: '❌ Erro ao atualizar',
        description: 'Não foi possível atualizar o link',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingLinkId(null);
    setCompsUrl('');
    setNotes('');
    setSalePrice('');
    setSquareFeet('');
    setBedrooms('');
    setBathrooms('');
    setSaleDate('');
    setAddFullData(false);

    toast({
      title: '❌ Edição cancelada',
      description: 'Formulário limpo',
    });
  };

  // Bulk Add - Adicionar múltiplas URLs de uma vez
  const handleBulkAdd = async () => {
    if (!selectedPropertyId || selectedPropertyId === 'manual') {
      toast({
        title: '⚠️ Selecione uma propriedade',
        description: 'Escolha a propriedade antes de adicionar comps',
        variant: 'destructive'
      });
      return;
    }

    // Parse URLs (uma por linha)
    const urls = bulkUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0 && (url.includes('zillow') || url.includes('trulia') || url.includes('redfin') || url.includes('realtor')));

    if (urls.length === 0) {
      toast({
        title: '⚠️ Nenhuma URL válida',
        description: 'Cole URLs do Zillow/Trulia/Redfin (uma por linha)',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    setBulkProgress({ current: 0, total: urls.length });
    const added: Array<{url: string, address: string, price?: string}> = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: '⚠️ Não autenticado',
          description: 'Faça login para salvar links',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      // Processar cada URL
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        setBulkProgress({ current: i + 1, total: urls.length });

        try {
          // Extrair dados da URL
          const extracted = extractDataFromUrl(url);
          const addressStr = formatExtractedAddress(extracted);

          // Preparar comp_data se tiver dados
          let compData = null;
          if (extracted.price || extracted.sqft) {
            compData = {
              salePrice: extracted.price,
              squareFeet: extracted.sqft,
              bedrooms: extracted.beds,
              bathrooms: extracted.baths,
              pricePerSqft: extracted.price && extracted.sqft ? Math.round(extracted.price / extracted.sqft) : undefined,
            };
          }

          // Salvar no banco
          const { error } = await supabase
            .from('manual_comps_links')
            .insert({
              property_address: propertyAddress,
              property_id: selectedPropertyId,
              url: url,
              source: extracted.source,
              notes: `Bulk add - ${addressStr || 'Auto detected'}`,
              comp_data: compData,
              user_id: user.id
            });

          if (error) throw error;

          added.push({
            url,
            address: addressStr || 'Unknown',
            price: extracted.price ? `$${extracted.price.toLocaleString()}` : undefined
          });

          // Pequeno delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          // Silently skip failed URLs
        }
      }

      // Atualizar lista e limpar
      setRecentlyAdded(added);
      loadLinks();
      setBulkUrls('');
      setShowBulkAdd(false);

      toast({
        title: '✅ Comps adicionados!',
        description: `${added.length} de ${urls.length} URLs adicionadas com sucesso`,
      });

      if (onLinkAdded) onLinkAdded();

    } catch (error) {
      console.error('Bulk add error:', error);
      toast({
        title: '❌ Erro no bulk add',
        description: 'Alguns comps podem não ter sido salvos',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter ou Cmd+Enter para salvar rápido
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && compsUrl && !saving) {
        e.preventDefault();
        handleSaveLink();
      }

      // Ctrl+Shift+B para abrir Bulk Add
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        setShowBulkAdd(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [compsUrl, saving, handleSaveLink]);

  useEffect(() => {
    loadProperties();
    loadLinks();
  }, []);

  // Auto-select property if passed from parent
  useEffect(() => {
    if (preSelectedPropertyId && properties.length > 0) {
      const property = properties.find(p => p.id === preSelectedPropertyId);
      if (property) {
        setSelectedPropertyId(preSelectedPropertyId);
        setPropertyAddress(`${property.address}, ${property.city}, ${property.state} ${property.zip_code}`);
        setFilterPropertyId(preSelectedPropertyId);
      }
    }
  }, [preSelectedPropertyId, properties]);

  // Filtrar links salvos
  const getFilteredLinks = () => {
    if (filterPropertyId === 'all') return savedLinks;
    return savedLinks.filter(link => link.property_id === filterPropertyId);
  };

  // Deletar link do Supabase
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('manual_comps_links' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '🗑️ Link removido',
        description: 'Link de comps removido',
      });

      loadLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        title: '❌ Erro ao remover',
        description: 'Não foi possível remover o link',
        variant: 'destructive'
      });
    }
  };

  // Copiar link
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: '📋 Copiado!',
      description: 'Link copiado para área de transferência',
    });
  };

  // Ícone da fonte
  const getSourceIcon = (source: SavedCompsLink['source']) => {
    const icons = {
      trulia: '🏡',
      zillow: '🏠',
      redfin: '🔴',
      realtor: '🏘️',
      other: '🔗'
    };
    return icons[source];
  };

  const getSourceLabel = (source: SavedCompsLink['source']) => {
    const labels = {
      trulia: 'Trulia',
      zillow: 'Zillow',
      redfin: 'Redfin',
      realtor: 'Realtor.com',
      other: 'Outro'
    };
    return labels[source];
  };

  return (
    <div className="space-y-6">
      {/* Informação - only show if NOT pre-selected */}
      {!preSelectedPropertyId && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link className="w-5 h-5" />
              Opção Manual - Simples e Rápido
            </CardTitle>
            <CardDescription>
              Salve links de páginas de comparáveis do Trulia, Zillow, Redfin, etc.
              Sem necessidade de API keys ou configurações complexas.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Simplified header when property is pre-selected */}
      {preSelectedPropertyId && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Adicionar Comps Manuais para esta Propriedade
                </CardTitle>
                <CardDescription>
                  Cole links de comparáveis do Zillow, Trulia, Redfin, etc. para complementar a análise automática
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Endereço</p>
                <p className="font-semibold text-sm">{propertyAddress}</p>
              </div>
              {properties.find(p => p.id === preSelectedPropertyId)?.estimated_value && (
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Valor Estimado</p>
                  <p className="font-semibold text-green-600">
                    ${properties.find(p => p.id === preSelectedPropertyId)!.estimated_value!.toLocaleString()}
                  </p>
                </div>
              )}
              {properties.find(p => p.id === preSelectedPropertyId)?.cash_offer_amount && properties.find(p => p.id === preSelectedPropertyId)!.cash_offer_amount! > 0 && (
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Oferta Atual</p>
                  <p className="font-semibold text-blue-600">
                    ${properties.find(p => p.id === preSelectedPropertyId)!.cash_offer_amount!.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário para adicionar link */}
      <Card>
        <CardHeader>
          {/* Banner de edição */}
          {editingLinkId && (
            <div className="mb-4 p-3 bg-blue-100 border-2 border-blue-400 rounded-lg">
              <div className="flex items-center gap-2 text-blue-900">
                <Pencil className="w-5 h-5" />
                <span className="font-semibold">✏️ Modo de Edição</span>
              </div>
              <p className="text-sm text-blue-800 mt-1">
                Faça as alterações e clique em "Atualizar Link"
              </p>
            </div>
          )}

          <CardTitle className="flex items-center gap-2">
            {editingLinkId ? (
              <>
                <Pencil className="w-5 h-5" />
                Editar Comp
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Adicionar Comp
              </>
            )}
          </CardTitle>
          <CardDescription>
            {editingLinkId
              ? 'Atualize os dados do comp'
              : preSelectedPropertyId
              ? 'Cole a URL e preencha o preço/sqft'
              : 'Selecione uma propriedade e adicione comps'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Property info - read-only if pre-selected */}
          {preSelectedPropertyId ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-5 h-5 text-green-600" />
                <Label className="text-green-900 font-semibold">Propriedade Selecionada</Label>
              </div>
              <p className="text-lg font-bold text-green-800">{propertyAddress}</p>
              <p className="text-xs text-green-700 mt-1">
                ✓ Propriedade selecionada automaticamente da aba Auto
              </p>
            </div>
          ) : (
            <>
              {/* Seleção de Propriedade - only if NOT pre-selected */}
              <div className="space-y-2">
                <Label htmlFor="property-select">Propriedade</Label>
                <Select value={selectedPropertyId} onValueChange={handlePropertySelect}>
                  <SelectTrigger id="property-select" disabled={saving}>
                    <SelectValue placeholder="Selecione uma propriedade ou digite manualmente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Digite Manualmente
                      </div>
                    </SelectItem>
                    {properties.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Suas Propriedades
                        </div>
                        {properties.map(property => (
                          <SelectItem key={property.id} value={property.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{property.address}</span>
                              <span className="text-xs text-muted-foreground">
                                {property.city}, {property.state} {property.zip_code}
                                {property.estimated_value && ` • $${property.estimated_value.toLocaleString()}`}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  💡 Selecione uma propriedade existente ou digite manualmente
                </p>
              </div>

              {/* Endereço da propriedade */}
              <div className="space-y-2">
                <Label htmlFor="property-address">Endereço da Propriedade</Label>
                <Input
                  id="property-address"
                  placeholder="Ex: 1025 S Washington Ave, Orlando, FL"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  disabled={saving || (selectedPropertyId && selectedPropertyId !== 'manual')}
                />
                {selectedPropertyId && selectedPropertyId !== 'manual' && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Endereço preenchido automaticamente
                  </p>
                )}

                {/* Botão para buscar no Zillow */}
                {propertyAddress && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const searchQuery = encodeURIComponent(`recently sold ${propertyAddress}`);
                      const zillowUrl = `https://www.zillow.com/homes/${searchQuery}_rb/`;
                      window.open(zillowUrl, '_blank');
                      toast({
                        title: '🔍 Abrindo Zillow',
                        description: 'Busque comps e copie as URLs',
                        duration: 3000,
                      });
                    }}
                    className="w-full mt-2"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    🏠 Buscar Comps no Zillow
                  </Button>
                )}
              </div>
            </>
          )}

          {/* URL do site de comps */}
          <div className="space-y-2">
            <Label htmlFor="comps-url">Link da Página de Comps</Label>
            <Input
              id="comps-url"
              type="url"
              placeholder="Ex: https://www.zillow.com/homedetails/123-Main-St-Orlando-FL-32801/..."
              value={compsUrl}
              onChange={(e) => {
                const newUrl = e.target.value;
                setCompsUrl(newUrl);

                // Auto-extract data from URL when pasted
                if (newUrl.length > 20 && (newUrl.includes('zillow') || newUrl.includes('redfin') || newUrl.includes('trulia') || newUrl.includes('realtor'))) {
                  try {
                    const extracted = extractDataFromUrl(newUrl);

                    // Show toast notification
                    if (isValidExtractedData(extracted)) {
                      const addressStr = formatExtractedAddress(extracted);
                      toast({
                        title: '✅ Dados detectados da URL',
                        description: addressStr || 'Endereço encontrado',
                        duration: 3000,
                      });
                    }
                  } catch (error) {
                    // Silently ignore extraction errors
                  }
                }
              }}
              disabled={saving}
            />
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground flex-1">
                💡 Cole o link e clique "Auto-Fill" para extrair dados automaticamente!
              </p>
              {compsUrl && (compsUrl.includes('zillow') || compsUrl.includes('trulia') || compsUrl.includes('redfin')) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      toast({ title: '🔍 Buscando dados...', description: 'Extraindo informações da URL' });

                      const extracted = extractDataFromUrl(compsUrl);

                      // For now, just use URL extraction (scraping is optional)
                      if (extracted.price) setSalePrice(extracted.price.toString());
                      if (extracted.sqft) setSquareFeet(extracted.sqft.toString());
                      if (extracted.beds) setBedrooms(extracted.beds.toString());
                      if (extracted.baths) setBathrooms(extracted.baths.toString());

                      toast({
                        title: '✅ Dados extraídos!',
                        description: formatExtractedAddress(extracted) || 'Informações preenchidas',
                      });
                    } catch (error) {
                      console.error('Auto-fill error:', error);
                      toast({
                        title: '⚠️ Não foi possível extrair',
                        description: 'Preencha os dados manualmente',
                        variant: 'destructive',
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || saving}
                >
                  {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : '🪄'}
                  Auto-Fill
                </Button>
              )}
            </div>
          </div>

          {/* Campos de Preço/Sqft - Sempre visíveis (opcionais) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              💰 Preço & Área (Opcional)
              <span className="text-xs text-muted-foreground font-normal">Preencha manual ou use Auto-Fill acima</span>
            </Label>
            <div className="grid grid-cols-2 gap-4 p-3 border-2 border-dashed border-green-300 rounded-lg bg-green-50/30">
              <div>
                <Label htmlFor="sale-price-quick" className="text-xs">Preço de Venda ($)</Label>
                <Input
                  id="sale-price-quick"
                  type="number"
                  placeholder="Ex: 250000"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className={salePrice ? 'border-green-500 border-2' : ''}
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="square-feet-quick" className="text-xs">Square Feet</Label>
                <Input
                  id="square-feet-quick"
                  type="number"
                  placeholder="Ex: 1500"
                  value={squareFeet}
                  onChange={(e) => setSquareFeet(e.target.value)}
                  className={squareFeet ? 'border-green-500 border-2' : ''}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Preview inline - mostra cálculo do $/Sqft */}
            {(salePrice || squareFeet) && (
              <div className="p-3 border-2 border-green-400 rounded-lg bg-green-100 text-green-900 text-sm font-semibold">
                ✓ Preview: {salePrice ? `Preço: $${Number(salePrice).toLocaleString()}` : ''}
                {squareFeet ? ` | Área: ${Number(squareFeet).toLocaleString()} sqft` : ''}
                {salePrice && squareFeet ? ` | $/Sqft: $${Math.round(Number(salePrice) / Number(squareFeet))}` : ''}
              </div>
            )}
          </div>

          {/* Notas (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Comps do mesmo condomínio, preços de 2024..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              disabled={saving}
            />
          </div>

          {/* Toggle para dados avançados (optional) */}
          <div className="flex items-center gap-2 mt-2">
            <Switch
              id="full-data-toggle"
              checked={addFullData}
              onCheckedChange={setAddFullData}
              disabled={saving}
            />
            <Label htmlFor="full-data-toggle" className="cursor-pointer text-sm">
              📋 Adicionar dados avançados (quartos, banheiros, data de venda)
            </Label>
          </div>

          {/* Advanced Fields */}
          {addFullData && (
            <div className="grid grid-cols-2 gap-4 mt-2 p-3 border rounded bg-amber-50/50">
              <div>
                <Label htmlFor="bedrooms" className="text-xs">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  placeholder="Ex: 3"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="bathrooms" className="text-xs">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  step="0.5"
                  placeholder="Ex: 2"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="sale-date" className="text-xs">Sale Date</Label>
                <Input
                  id="sale-date"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {editingLinkId ? (
              <>
                <Button onClick={handleUpdateLink} className="flex-1" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Pencil className="w-4 h-4 mr-2" />
                      Atualizar Link
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSaveLink} className="flex-1" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Salvar Link
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setShowBulkAdd(!showBulkAdd)}
                  variant={showBulkAdd ? "default" : "outline"}
                  disabled={saving}
                  className="whitespace-nowrap"
                >
                  📋 Bulk Add
                </Button>
              </>
            )}
          </div>

          {/* Bulk Add Section */}
          {showBulkAdd && (
            <div className="mt-4 p-4 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                  🚀 Bulk Add - Adicione Múltiplas URLs
                </h4>
                {bulkProgress.total > 0 && (
                  <span className="text-sm text-purple-700">
                    {bulkProgress.current} / {bulkProgress.total}
                  </span>
                )}
              </div>

              <p className="text-xs text-purple-800">
                Cole múltiplas URLs do Zillow/Trulia/Redfin (uma por linha) e adicione todas de uma vez!
              </p>

              <Textarea
                placeholder={`https://www.zillow.com/homedetails/123-Main-St...
https://www.zillow.com/homedetails/456-Oak-Ave...
https://www.trulia.com/p/fl/orlando/789-Elm-Dr...

Cole quantas URLs quiser (recomendado: 5-10)`}
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                rows={8}
                disabled={saving}
                className="font-mono text-xs"
              />

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleBulkAdd}
                  disabled={saving || !bulkUrls.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adicionando {bulkProgress.current}/{bulkProgress.total}...
                    </>
                  ) : (
                    <>
                      ⚡ Adicionar Todas ({bulkUrls.split('\n').filter(url => url.trim() && (url.includes('zillow') || url.includes('trulia') || url.includes('redfin'))).length})
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    setShowBulkAdd(false);
                    setBulkUrls('');
                  }}
                  variant="outline"
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>

              {/* Recently Added Preview */}
              {recentlyAdded.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm font-semibold text-green-900 mb-2">
                    ✅ Adicionados recentemente ({recentlyAdded.length}):
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {recentlyAdded.map((item, idx) => (
                      <div key={idx} className="text-xs text-green-800 flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="flex-1">
                          {item.address} {item.price && `- ${item.price}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de links salvos */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : savedLinks.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Links Salvos ({getFilteredLinks().length}{filterPropertyId !== 'all' && ` de ${savedLinks.length}`})
                </CardTitle>
                <CardDescription>
                  Seus links de comps salvos
                </CardDescription>
              </div>

              {/* Filtro por propriedade */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterPropertyId} onValueChange={setFilterPropertyId}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Propriedades</SelectItem>
                    {properties.filter(p =>
                      savedLinks.some(link => link.property_id === p.id)
                    ).map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Sqft</TableHead>
                  <TableHead className="text-right">$/Sqft</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredLinks().map((link) => {
                  const salePrice = link.comp_data?.sale_price;
                  const squareFeet = link.comp_data?.square_feet;
                  const pricePerSqft = salePrice && squareFeet ? salePrice / squareFeet : null;

                  return (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      {link.property_address}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getSourceIcon(link.source)}</span>
                        <span className="text-sm">{getSourceLabel(link.source)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700">
                      {salePrice ? `$${salePrice.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {squareFeet ? squareFeet.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-700">
                      {pricePerSqft ? `$${Math.round(pricePerSqft)}` : '-'}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                      {link.notes || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(link.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(link.url, '_blank')}
                          title="Abrir link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(link.url)}
                          title="Copiar link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditLink(link)}
                          title="Editar"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(link.id)}
                          title="Remover"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {/* Card de Resumo e Calculadora de Proposta */}
      {getFilteredLinks().length > 0 && (() => {
        const linksWithData = getFilteredLinks().filter(link =>
          link.comp_data?.sale_price && link.comp_data?.square_feet
        );

        if (linksWithData.length === 0) return null;

        const avgPrice = linksWithData.reduce((sum, link) =>
          sum + (link.comp_data!.sale_price || 0), 0
        ) / linksWithData.length;

        const avgSqft = linksWithData.reduce((sum, link) =>
          sum + (link.comp_data!.square_feet || 0), 0
        ) / linksWithData.length;

        const avgPricePerSqft = avgPrice / avgSqft;

        // Percentuais de oferta
        const offers = [
          { label: '70%', percent: 0.70, color: 'text-red-700 bg-red-50 border-red-300' },
          { label: '75%', percent: 0.75, color: 'text-orange-700 bg-orange-50 border-orange-300' },
          { label: '80%', percent: 0.80, color: 'text-amber-700 bg-amber-50 border-amber-300' },
          { label: '85%', percent: 0.85, color: 'text-yellow-700 bg-yellow-50 border-yellow-300' },
          { label: '90%', percent: 0.90, color: 'text-green-700 bg-green-50 border-green-300' },
        ];

        return (
          <Card className="border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Resumo dos Comps & Calculadora de Proposta
              </CardTitle>
              <CardDescription>
                Análise de {linksWithData.length} comp{linksWithData.length > 1 ? 's' : ''} com dados completos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Médias */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border-2 border-green-200">
                  <p className="text-xs text-muted-foreground mb-1">Preço Médio</p>
                  <p className="text-2xl font-bold text-green-700">
                    ${Math.round(avgPrice).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                  <p className="text-xs text-muted-foreground mb-1">Sqft Médio</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {Math.round(avgSqft).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
                  <p className="text-xs text-muted-foreground mb-1">$/Sqft Médio</p>
                  <p className="text-2xl font-bold text-purple-700">
                    ${Math.round(avgPricePerSqft)}
                  </p>
                </div>
              </div>

              {/* Calculadora de Proposta */}
              <div className="p-4 bg-white rounded-lg border-2 border-dashed border-purple-300">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  💰 Calculadora de Proposta Rápida
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Baseado no preço médio de ${Math.round(avgPrice).toLocaleString()}
                </p>
                <div className="grid grid-cols-5 gap-3">
                  {offers.map(offer => {
                    const offerAmount = avgPrice * offer.percent;
                    return (
                      <div
                        key={offer.label}
                        className={`p-3 rounded-lg border-2 ${offer.color} cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => {
                          navigator.clipboard.writeText(Math.round(offerAmount).toString());
                          toast({
                            title: '📋 Copiado!',
                            description: `$${Math.round(offerAmount).toLocaleString()} (${offer.label})`,
                          });
                        }}
                      >
                        <p className="text-xs font-semibold mb-1">{offer.label}</p>
                        <p className="text-lg font-bold">
                          ${Math.round(offerAmount).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  💡 Clique em qualquer valor para copiar
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Exemplos de como usar */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">💡 Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>1. Trulia:</strong> Vá para{' '}
            <a
              href="https://www.trulia.com/sold/Orlando,FL/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Trulia Sold Homes
            </a>
          </div>
          <div>
            <strong>2. Zillow:</strong> Vá para{' '}
            <a
              href="https://www.zillow.com/orlando-fl/sold/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Zillow Sold
            </a>
          </div>
          <div>
            <strong>3. Redfin:</strong> Vá para{' '}
            <a
              href="https://www.redfin.com/city/13654/FL/Orlando/filter/include=sold-3mo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Redfin Sold
            </a>
          </div>
          <div className="pt-2 border-t">
            <strong>📍 Busque por área:</strong> Digite o endereço, filtre por vendas recentes,
            copie a URL da página e salve aqui!
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
