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
  FileText
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

  // Estados para dados completos e modo rápido
  const [addFullData, setAddFullData] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [saleDate, setSaleDate] = useState('');

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

      // Preparar dados completos se ativado (Quick Add ou Full Data)
      let compData = null;
      if (quickAdd || addFullData) {
        // Quick Add: apenas preço e sqft (opcionais)
        // Full Data: todos os campos (preço e sqft obrigatórios)
        
        if (addFullData) {
          // Validar campos obrigatórios quando dados completos
          if (!salePrice || parseFloat(salePrice) <= 0) {
            toast({
              title: '⚠️ Preço inválido',
              description: 'Informe um preço de venda válido',
              variant: 'destructive'
            });
            setSaving(false);
            return;
          }
          if (!squareFeet || parseFloat(squareFeet) <= 0) {
            toast({
              title: '⚠️ Área inválida',
              description: 'Informe a área em sqft',
              variant: 'destructive'
            });
            setSaving(false);
            return;
          }
        }

        // Se tem preço ou sqft preenchidos, incluir no comp_data
        if (salePrice || squareFeet) {
          compData = {
            sale_price: salePrice ? parseFloat(salePrice) : undefined,
            square_feet: squareFeet ? parseFloat(squareFeet) : undefined,
            bedrooms: addFullData && bedrooms ? parseInt(bedrooms) : undefined,
            bathrooms: addFullData && bathrooms ? parseFloat(bathrooms) : undefined,
            sale_date: addFullData && saleDate ? saleDate : undefined
          };
        }
      }

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

      // Limpar formulário e recarregar lista
      setSelectedPropertyId('');
      setPropertyAddress('');
      setCompsUrl('');
      setNotes('');
      setSalePrice('');
      setSquareFeet('');
      setBedrooms('');
      setBathrooms('');
      setSaleDate('');
      setAddFullData(false);
      setQuickAdd(false);
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
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Link de Comps
          </CardTitle>
          <CardDescription>
            {preSelectedPropertyId
              ? 'Cole o link da página de comps para a propriedade selecionada'
              : 'Selecione uma propriedade e cole o link da página de comps'
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
              </div>
            </>
          )}

          {/* URL do site de comps */}
          <div className="space-y-2">
            <Label htmlFor="comps-url">Link da Página de Comps</Label>
            <Input
              id="comps-url"
              type="url"
              placeholder="Ex: https://www.trulia.com/sold/Orlando,FL/..."
              value={compsUrl}
              onChange={(e) => setCompsUrl(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              💡 Dica: Abra Trulia/Zillow, busque vendas recentes próximas, copie a URL
            </p>
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


          {/* Modo Rápido (Quick Add) */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              type="button"
              variant={quickAdd ? 'default' : 'outline'}
              onClick={() => setQuickAdd((v) => !v)}
              disabled={saving}
            >
              Quick Add
            </Button>
            <span className="text-xs text-muted-foreground">Adicionar preço/sqft rapidamente</span>
          </div>
          {(quickAdd || addFullData) && (
            <div className="grid grid-cols-2 gap-4 mt-2 p-2 border rounded bg-muted/30">
              <div>
                <Label htmlFor="sale-price-quick">Preço ($)</Label>
                <Input
                  id="sale-price-quick"
                  type="number"
                  placeholder="Ex: 250000"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className={salePrice ? 'border-green-500' : ''}
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="square-feet-quick">Sqft</Label>
                <Input
                  id="square-feet-quick"
                  type="number"
                  placeholder="Ex: 1500"
                  value={squareFeet}
                  onChange={(e) => setSquareFeet(e.target.value)}
                  className={squareFeet ? 'border-green-500' : ''}
                  disabled={saving}
                />
              </div>
              {addFullData && (
                <>
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
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
                    <Label htmlFor="bathrooms">Bathrooms</Label>
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
                    <Label htmlFor="sale-date">Sale Date</Label>
                    <Input
                      id="sale-date"
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          {/* Toggle para dados completos */}
          <div className="flex items-center gap-2 mt-2">
            <Switch
              id="full-data-toggle"
              checked={addFullData}
              onCheckedChange={setAddFullData}
              disabled={saving}
            />
            <Label htmlFor="full-data-toggle" className="cursor-pointer">
              Adicionar dados completos (quartos, banheiros, data)
            </Label>
          </div>
          {/* Preview do comp manual */}
          {(salePrice || squareFeet) && (
            <div className="mt-2 p-2 border rounded bg-green-50 text-green-900 text-xs">
              <b>Preview:</b> {salePrice ? `Preço: $${salePrice}` : ''} {squareFeet ? `| Sqft: ${squareFeet}` : ''}
            </div>
          )}

          <Button onClick={handleSaveLink} className="w-full" disabled={saving}>
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
                  <TableHead>Notas</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredLinks().map((link) => (
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
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
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
                          onClick={() => handleDelete(link.id)}
                          title="Remover"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

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
