/**
 * CompsStep - Step 3: Card-based flow for adding comps
 * Shows one approved property at a time with photo, arrows to navigate,
 * and simplified comp form inline.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PropertyImageDisplay } from '@/components/PropertyImageDisplay';
import { extractDataFromUrl, formatExtractedAddress, isValidExtractedData } from '@/utils/urlDataExtractor';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  MapPin,
  CheckCircle,
  DollarSign,
  Home,
  Ruler,
} from 'lucide-react';

interface ApprovedProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  property_image_url: string | null;
  estimated_value: number | null;
  cash_offer_amount: number | null;
  square_feet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  year_built: number | null;
  owner_name: string | null;
}

interface SavedComp {
  id: string;
  url: string;
  source: string;
  comp_data: {
    sale_price?: number;
    square_feet?: number;
  } | null;
  created_at: string;
}

export const CompsStep = () => {
  const [properties, setProperties] = useState<ApprovedProperty[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [comps, setComps] = useState<SavedComp[]>([]);
  const [compsLoading, setCompsLoading] = useState(false);
  const { toast } = useToast();

  // Form state
  const [compUrl, setCompUrl] = useState('');
  const [compPrice, setCompPrice] = useState('');
  const [compSqft, setCompSqft] = useState('');
  const [saving, setSaving] = useState(false);

  const currentProperty = properties[currentIndex];
  const progress = properties.length > 0 ? ((currentIndex + 1) / properties.length) * 100 : 0;

  // Fetch approved properties
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, city, state, zip_code, property_image_url, estimated_value, cash_offer_amount, square_feet, bedrooms, bathrooms, year_built, owner_name')
        .eq('approval_status', 'approved')
        .order('approved_at', { ascending: false })
        .limit(100);

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        setProperties(data || []);
      }
      setIsLoading(false);
    };
    fetchProperties();
  }, []);

  // Fetch comps when property changes
  useEffect(() => {
    if (!currentProperty) return;
    const fetchComps = async () => {
      setCompsLoading(true);
      const { data, error } = await supabase
        .from('manual_comps_links' as any)
        .select('id, url, source, comp_data, created_at')
        .eq('property_id', currentProperty.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comps:', error);
      } else {
        setComps((data as unknown as SavedComp[]) || []);
      }
      setCompsLoading(false);
    };
    fetchComps();
    // Reset form
    setCompUrl('');
    setCompPrice('');
    setCompSqft('');
  }, [currentIndex, currentProperty?.id]);

  const handleNext = () => {
    if (currentIndex < properties.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrevious(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, properties.length]);

  // Detect source from URL
  const detectSource = (url: string): string => {
    if (url.includes('trulia.com')) return 'trulia';
    if (url.includes('zillow.com')) return 'zillow';
    if (url.includes('redfin.com')) return 'redfin';
    if (url.includes('realtor.com')) return 'realtor';
    return 'other';
  };

  const handleAddComp = async () => {
    if (!currentProperty) return;
    if (!compUrl.trim()) {
      toast({ title: 'URL necessario', description: 'Cole o link do comp', variant: 'destructive' });
      return;
    }
    if (!compPrice || !compSqft) {
      toast({ title: 'Dados incompletos', description: 'Preencha preco e sqft', variant: 'destructive' });
      return;
    }

    const priceNum = parseFloat(compPrice);
    const sqftNum = parseFloat(compSqft);
    if (priceNum <= 0 || sqftNum <= 0 || isNaN(priceNum) || isNaN(sqftNum)) {
      toast({ title: 'Valores invalidos', description: 'Preco e sqft devem ser maiores que zero', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Nao autenticado', variant: 'destructive' });
        setSaving(false);
        return;
      }

      const addressStr = `${currentProperty.address}, ${currentProperty.city || ''}, ${currentProperty.state || ''} ${currentProperty.zip_code || ''}`;

      const { error } = await supabase
        .from('manual_comps_links' as any)
        .insert([{
          property_address: addressStr,
          property_id: currentProperty.id,
          url: compUrl.trim(),
          source: detectSource(compUrl),
          comp_data: { sale_price: priceNum, square_feet: sqftNum },
          user_id: user.id,
        }]);

      if (error) throw error;

      toast({ title: 'Comp adicionado!', description: `$${priceNum.toLocaleString()} | ${sqftNum} sqft` });

      // Refresh comps
      const { data: newComps } = await supabase
        .from('manual_comps_links' as any)
        .select('id, url, source, comp_data, created_at')
        .eq('property_id', currentProperty.id)
        .order('created_at', { ascending: false });

      setComps((newComps as unknown as SavedComp[]) || []);
      setCompUrl('');
      setCompPrice('');
      setCompSqft('');
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComp = async (compId: string) => {
    try {
      const { error } = await supabase
        .from('manual_comps_links' as any)
        .delete()
        .eq('id', compId);

      if (error) throw error;
      setComps(comps.filter(c => c.id !== compId));
      toast({ title: 'Comp removido' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  // Calculate avg $/sqft from comps
  const validComps = comps.filter(c => c.comp_data?.sale_price && c.comp_data?.square_feet && c.comp_data.square_feet > 0);
  const avgPricePerSqft = validComps.length > 0
    ? validComps.reduce((sum, c) => sum + (c.comp_data!.sale_price! / c.comp_data!.square_feet!), 0) / validComps.length
    : 0;
  const estimatedARV = currentProperty?.square_feet && avgPricePerSqft > 0
    ? currentProperty.square_feet * avgPricePerSqft
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
        <Home className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-muted-foreground">Nenhuma propriedade aprovada</p>
        <p className="text-sm text-muted-foreground">Aprove propriedades no Passo 2 para adicionar comps</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1 sm:px-0 max-w-4xl mx-auto">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        <div className="text-center">
          <p className="text-sm font-semibold">{currentIndex + 1} de {properties.length}</p>
          <p className="text-xs text-muted-foreground">propriedades aprovadas</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentIndex === properties.length - 1}
          className="gap-1.5"
        >
          <span className="hidden sm:inline">Proxima</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Progress value={progress} className="h-1.5" />

      {/* Property Card */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Photo */}
            <div className="aspect-[4/3] md:aspect-auto md:min-h-[300px]">
              <PropertyImageDisplay
                imageUrl={currentProperty.property_image_url}
                address={currentProperty.address}
                className="h-full w-full rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                showZoom={true}
              />
            </div>

            {/* Info */}
            <div className="p-4 sm:p-5 space-y-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold line-clamp-2">{currentProperty.address}</h2>
                <p className="text-sm text-muted-foreground">
                  {[currentProperty.city, currentProperty.state].filter(Boolean).join(', ')} {currentProperty.zip_code}
                </p>
                {currentProperty.owner_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">{currentProperty.owner_name}</p>
                )}
              </div>

              {/* Property badges */}
              <div className="flex flex-wrap gap-1.5">
                {currentProperty.square_feet && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Ruler className="h-3 w-3" />
                    {currentProperty.square_feet.toLocaleString()} sqft
                  </Badge>
                )}
                {currentProperty.bedrooms && (
                  <Badge variant="secondary" className="text-xs">{currentProperty.bedrooms} quartos</Badge>
                )}
                {currentProperty.bathrooms && (
                  <Badge variant="secondary" className="text-xs">{currentProperty.bathrooms} ban.</Badge>
                )}
                {currentProperty.year_built && (
                  <Badge variant="secondary" className="text-xs">{currentProperty.year_built}</Badge>
                )}
              </div>

              {/* Value cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted rounded-lg p-2.5">
                  <p className="text-[10px] text-muted-foreground">Valor Estimado</p>
                  <p className="text-sm sm:text-base font-bold">
                    ${currentProperty.estimated_value?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-2.5">
                  <p className="text-[10px] text-muted-foreground">Oferta</p>
                  <p className="text-sm sm:text-base font-bold">
                    ${currentProperty.cash_offer_amount?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>

              {/* External links */}
              <div className="flex flex-wrap gap-1.5">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentProperty.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-100"
                >
                  <MapPin className="w-3 h-3" /> Maps
                </a>
                <a
                  href={`https://www.zillow.com/homes/${encodeURIComponent(currentProperty.address)}_rb/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold hover:bg-blue-100"
                >
                  Z Zillow
                </a>
                <a
                  href={`https://www.trulia.com/homes/${encodeURIComponent(currentProperty.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold hover:bg-green-100"
                >
                  T Trulia
                </a>
                <a
                  href={`https://www.redfin.com/search#query=${encodeURIComponent(currentProperty.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold hover:bg-red-100"
                >
                  R Redfin
                </a>
              </div>

              {/* Comps summary */}
              {validComps.length > 0 && (
                <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-green-800">
                      {validComps.length} comp{validComps.length > 1 ? 's' : ''} | $/sqft: ${Math.round(avgPricePerSqft)}
                    </span>
                    {estimatedARV > 0 && (
                      <span className="text-xs font-bold text-green-700">
                        ARV: ${Math.round(estimatedARV).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Comp Form - Simplified */}
      <Card>
        <CardHeader className="px-3 sm:px-5 py-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Comp
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-5 space-y-3">
          {/* URL */}
          <div>
            <Label className="text-xs">Link do Comp</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="url"
                placeholder="https://www.zillow.com/homedetails/..."
                value={compUrl}
                onChange={(e) => {
                  const newUrl = e.target.value;
                  setCompUrl(newUrl);
                  // Auto-extract from URL
                  if (newUrl.length > 20) {
                    try {
                      const extracted = extractDataFromUrl(newUrl);
                      if (extracted.price) setCompPrice(extracted.price.toString());
                      if (extracted.sqft) setCompSqft(extracted.sqft.toString());
                    } catch {}
                  }
                }}
                disabled={saving}
                className="text-sm"
              />
              {compUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(compUrl, '_blank')}
                  className="shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Price + Sqft inline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Preco ($)</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="250000"
                  value={compPrice}
                  onChange={(e) => setCompPrice(e.target.value)}
                  disabled={saving}
                  className="pl-7 text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Sqft</Label>
              <div className="relative mt-1">
                <Ruler className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="1500"
                  value={compSqft}
                  onChange={(e) => setCompSqft(e.target.value)}
                  disabled={saving}
                  className="pl-7 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {compPrice && compSqft && (
            <div className="p-2 bg-green-50 border border-green-200 rounded text-xs font-semibold text-green-800">
              $/Sqft: ${Math.round(Number(compPrice) / Number(compSqft))}
            </div>
          )}

          {/* Save button */}
          <Button
            onClick={handleAddComp}
            disabled={saving || !compUrl}
            className="w-full gap-2"
            size="sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Salvando...' : 'Adicionar Comp'}
          </Button>
        </CardContent>
      </Card>

      {/* Saved Comps for this property */}
      {compsLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comps.length > 0 ? (
        <Card>
          <CardHeader className="px-3 sm:px-5 py-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Comps Salvos ({comps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-5 space-y-2">
            {comps.map((comp) => {
              const price = comp.comp_data?.sale_price;
              const sqft = comp.comp_data?.square_feet;
              const pricePerSqft = price && sqft && sqft > 0 ? price / sqft : null;

              return (
                <div
                  key={comp.id}
                  className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className="text-[10px] shrink-0 uppercase">
                      {comp.source}
                    </Badge>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        {price && (
                          <span className="font-bold text-green-700">${price.toLocaleString()}</span>
                        )}
                        {sqft && (
                          <span className="text-muted-foreground">{sqft} sqft</span>
                        )}
                        {pricePerSqft && (
                          <Badge variant="secondary" className="text-[10px]">
                            ${Math.round(pricePerSqft)}/sqft
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(comp.url, '_blank')}
                      className="h-7 w-7 p-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComp(comp.id)}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            {validComps.length > 0 && (
              <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg mt-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">$/Sqft Medio</p>
                    <p className="text-lg font-bold text-green-700">${Math.round(avgPricePerSqft)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Sqft Propriedade</p>
                    <p className="text-lg font-bold text-blue-700">
                      {currentProperty.square_feet?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">ARV Estimado</p>
                    <p className="text-lg font-bold text-purple-700">
                      {estimatedARV > 0 ? `$${Math.round(estimatedARV).toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">Nenhum comp adicionado para esta propriedade</p>
          <p className="text-xs mt-1">Busque comps no Zillow/Trulia e adicione acima</p>
        </div>
      )}
    </div>
  );
};
