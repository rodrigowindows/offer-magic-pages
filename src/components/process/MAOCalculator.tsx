/**
 * MAO Calculator - Maximum Allowable Offer
 * Step 2: Calculate offer price based on ARV, renovation costs, and wholesale commission
 * Formula: MAO = ARV - Renovation Cost - Wholesale Commission
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  Calculator,
  Home,
  Save,
  Hammer,
  Percent,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
} from 'lucide-react';

interface ApprovedProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  square_feet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  year_built: number | null;
  estimated_value: number | null;
  owner_name: string | null;
  // MAO fields
  renovation_type: string | null;
  renovation_pct: number | null;
  renovation_value: number | null;
  wholesale_pct: number | null;
  wholesale_value: number | null;
  arv: number | null;
  mao: number | null;
  avg_price_per_sqft: number | null;
}

interface CompData {
  sale_price?: number;
  square_feet?: number;
}

interface ManualComp {
  id: string;
  property_id: string | null;
  comp_data: CompData | null;
}

type RenovationType = 'light' | 'medium' | 'heavy' | 'custom';
type InputMode = 'percent' | 'value';

const RENOVATION_DEFAULTS: Record<RenovationType, number> = {
  light: 10,
  medium: 25,
  heavy: 40,
  custom: 0,
};

const RENOVATION_LABELS: Record<RenovationType, string> = {
  light: 'Leve (10%)',
  medium: 'Média (25%)',
  heavy: 'Grande (40%)',
  custom: 'Personalizada',
};

export const MAOCalculator = () => {
  const [properties, setProperties] = useState<ApprovedProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Calculator state
  const [avgPricePerSqft, setAvgPricePerSqft] = useState<number>(0);
  const [renovationType, setRenovationType] = useState<RenovationType>('medium');
  const [renovationInputMode, setRenovationInputMode] = useState<InputMode>('percent');
  const [renovationPct, setRenovationPct] = useState<string>('25');
  const [renovationValue, setRenovationValue] = useState<string>('');
  const [wholesaleInputMode, setWholesaleInputMode] = useState<InputMode>('percent');
  const [wholesalePct, setWholesalePct] = useState<string>('10');
  const [wholesaleValue, setWholesaleValue] = useState<string>('');
  const [compsCount, setCompsCount] = useState(0);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Fetch approved properties
  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('id, address, city, state, zip_code, square_feet, bedrooms, bathrooms, year_built, estimated_value, owner_name, renovation_type, renovation_pct, renovation_value, wholesale_pct, wholesale_value, arv, mao, avg_price_per_sqft')
      .eq('approval_status', 'approved')
      .order('address', { ascending: true });

    if (error) {
      console.error('Error fetching properties:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setProperties((data as unknown as ApprovedProperty[]) || []);
    }
    setLoading(false);
  };

  // Fetch comps for selected property
  const fetchCompsData = async (propertyId: string) => {
    const { data, error } = await supabase
      .from('manual_comps_links')
      .select('id, property_id, comp_data')
      .eq('property_id', propertyId);

    if (error) {
      console.error('Error fetching comps:', error);
      return;
    }

    const comps = (data as unknown as ManualComp[]) || [];
    const validComps = comps.filter(
      c => c.comp_data?.sale_price && c.comp_data?.square_feet && c.comp_data.square_feet > 0
    );

    setCompsCount(validComps.length);

    if (validComps.length > 0) {
      const totalPricePerSqft = validComps.reduce((sum, c) => {
        return sum + (c.comp_data!.sale_price! / c.comp_data!.square_feet!);
      }, 0);
      const avg = totalPricePerSqft / validComps.length;
      setAvgPricePerSqft(Math.round(avg));
    } else {
      setAvgPricePerSqft(0);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // When property is selected, load its saved values and comps
  useEffect(() => {
    if (!selectedPropertyId) return;

    const prop = properties.find(p => p.id === selectedPropertyId);
    if (!prop) return;

    fetchCompsData(selectedPropertyId);

    // Load saved values if they exist
    if (prop.avg_price_per_sqft) {
      setAvgPricePerSqft(prop.avg_price_per_sqft);
    }
    if (prop.renovation_type) {
      setRenovationType(prop.renovation_type as RenovationType);
    }
    if (prop.renovation_pct) {
      setRenovationPct(prop.renovation_pct.toString());
      setRenovationInputMode('percent');
    }
    if (prop.renovation_value && !prop.renovation_pct) {
      setRenovationValue(prop.renovation_value.toString());
      setRenovationInputMode('value');
    }
    if (prop.wholesale_pct) {
      setWholesalePct(prop.wholesale_pct.toString());
      setWholesaleInputMode('percent');
    }
    if (prop.wholesale_value && !prop.wholesale_pct) {
      setWholesaleValue(prop.wholesale_value.toString());
      setWholesaleInputMode('value');
    }
  }, [selectedPropertyId, properties]);

  // When renovation type changes, set default percentage
  useEffect(() => {
    if (renovationType !== 'custom') {
      setRenovationPct(RENOVATION_DEFAULTS[renovationType].toString());
      setRenovationInputMode('percent');
    }
  }, [renovationType]);

  // Calculations
  const calculations = useMemo(() => {
    if (!selectedProperty || !selectedProperty.square_feet || avgPricePerSqft <= 0) {
      return null;
    }

    const sqft = selectedProperty.square_feet;
    const arv = sqft * avgPricePerSqft;

    // Renovation cost
    let renovationCost = 0;
    if (renovationInputMode === 'percent') {
      const pct = parseFloat(renovationPct) || 0;
      renovationCost = arv * (pct / 100);
    } else {
      renovationCost = parseFloat(renovationValue) || 0;
    }

    // Wholesale commission
    let wholesaleCost = 0;
    if (wholesaleInputMode === 'percent') {
      const pct = parseFloat(wholesalePct) || 0;
      wholesaleCost = arv * (pct / 100);
    } else {
      wholesaleCost = parseFloat(wholesaleValue) || 0;
    }

    const mao = arv - renovationCost - wholesaleCost;

    return {
      sqft,
      avgPricePerSqft,
      arv,
      renovationCost,
      wholesaleCost,
      mao,
      renovationPctCalc: renovationInputMode === 'percent' ? parseFloat(renovationPct) || 0 : (arv > 0 ? (renovationCost / arv) * 100 : 0),
      wholesalePctCalc: wholesaleInputMode === 'percent' ? parseFloat(wholesalePct) || 0 : (arv > 0 ? (wholesaleCost / arv) * 100 : 0),
    };
  }, [selectedProperty, avgPricePerSqft, renovationType, renovationPct, renovationValue, renovationInputMode, wholesalePct, wholesaleValue, wholesaleInputMode]);

  // Save MAO to database
  const handleSave = async () => {
    if (!selectedPropertyId || !calculations) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          renovation_type: renovationType,
          renovation_pct: renovationInputMode === 'percent' ? parseFloat(renovationPct) || null : null,
          renovation_value: calculations.renovationCost || null,
          wholesale_pct: wholesaleInputMode === 'percent' ? parseFloat(wholesalePct) || null : null,
          wholesale_value: calculations.wholesaleCost || null,
          arv: calculations.arv,
          mao: calculations.mao,
          avg_price_per_sqft: avgPricePerSqft,
          cash_offer_amount: Math.round(calculations.mao),
        } as any)
        .eq('id', selectedPropertyId);

      if (error) throw error;

      toast({
        title: 'MAO salvo!',
        description: `Oferta máxima de ${formatCurrency(calculations.mao)} salva para ${selectedProperty?.address}`,
      });

      fetchProperties();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyMAO = () => {
    if (!calculations) return;
    navigator.clipboard.writeText(Math.round(calculations.mao).toString());
    toast({ title: 'Copiado!', description: `${formatCurrency(calculations.mao)} copiado` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">Passo 2: Oferta MAO</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Calcular oferta máxima (ARV - Reforma - Comissão)
          </p>
        </div>
      </div>

      {/* Property Selector */}
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Home className="h-4 w-4 sm:h-5 sm:w-5" />
            Selecionar Propriedade Aprovada
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {properties.length} propriedades aprovadas disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma propriedade aprovada..." />
            </SelectTrigger>
            <SelectContent>
              {properties.map(prop => (
                <SelectItem key={prop.id} value={prop.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{prop.address}</span>
                    <span className="text-xs text-muted-foreground">
                      {prop.city}, {prop.state}
                      {prop.square_feet ? ` | ${prop.square_feet} sqft` : ''}
                      {prop.mao ? ` | MAO: ${formatCurrency(prop.mao)}` : ''}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* No property selected */}
      {!selectedPropertyId && (
        <Card className="p-6 sm:p-8 text-center border-dashed border-2">
          <Calculator className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Selecione uma propriedade para calcular a oferta MAO</p>
        </Card>
      )}

      {/* Calculator */}
      {selectedProperty && (
        <>
          {/* Property Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4 px-3 sm:px-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Endereço</p>
                  <p className="text-xs sm:text-sm font-semibold">{selectedProperty.address}</p>
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Área Construída</p>
                  <p className="text-xs sm:text-sm font-bold text-blue-700">
                    {selectedProperty.square_feet ? `${selectedProperty.square_feet.toLocaleString()} sqft` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Quartos / Banheiros</p>
                  <p className="text-xs sm:text-sm font-semibold">
                    {selectedProperty.bedrooms || '-'} / {selectedProperty.bathrooms || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Proprietário</p>
                  <p className="text-xs sm:text-sm font-semibold truncate">{selectedProperty.owner_name || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avg Price per Sqft from Comps */}
          <Card>
            <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
                Preço Médio por Sqft (dos Comparativos)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-xs">$/Sqft Médio dos Comps</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={avgPricePerSqft || ''}
                        onChange={(e) => setAvgPricePerSqft(parseFloat(e.target.value) || 0)}
                        className="pl-8"
                        placeholder="Ex: 180"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCompsData(selectedPropertyId)}
                      title="Recalcular dos comps"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {compsCount > 0 ? (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Calculado a partir de {compsCount} comparativo{compsCount > 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Nenhum comp encontrado. Insira o valor manualmente ou adicione comps no Passo 1.
                </p>
              )}

              {/* ARV Preview */}
              {selectedProperty.square_feet && avgPricePerSqft > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-800 font-semibold">ARV (After Repair Value)</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-700">
                    {formatCurrency(selectedProperty.square_feet * avgPricePerSqft)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-green-600">
                    {selectedProperty.square_feet.toLocaleString()} sqft x ${avgPricePerSqft}/sqft
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Renovation Type */}
          <Card>
            <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Hammer className="h-4 w-4 sm:h-5 sm:w-5" />
                Tipo de Reforma
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 space-y-4">
              {/* Quick select buttons */}
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(RENOVATION_DEFAULTS) as RenovationType[]).map(type => (
                  <Button
                    key={type}
                    variant={renovationType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRenovationType(type)}
                    className="text-xs sm:text-sm"
                  >
                    {RENOVATION_LABELS[type]}
                  </Button>
                ))}
              </div>

              {/* Input mode toggle + value */}
              <div className="flex items-center gap-3">
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    className={`px-3 py-1.5 text-xs font-medium ${renovationInputMode === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                    onClick={() => setRenovationInputMode('percent')}
                  >
                    <Percent className="h-3 w-3" />
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs font-medium ${renovationInputMode === 'value' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                    onClick={() => setRenovationInputMode('value')}
                  >
                    <DollarSign className="h-3 w-3" />
                  </button>
                </div>

                {renovationInputMode === 'percent' ? (
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={renovationPct}
                      onChange={(e) => {
                        setRenovationPct(e.target.value);
                        if (renovationType !== 'custom' && parseFloat(e.target.value) !== RENOVATION_DEFAULTS[renovationType]) {
                          setRenovationType('custom');
                        }
                      }}
                      placeholder="25"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                  </div>
                ) : (
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={renovationValue}
                      onChange={(e) => {
                        setRenovationValue(e.target.value);
                        setRenovationType('custom');
                      }}
                      placeholder="75000"
                      className="pl-8"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Wholesale Commission */}
          <Card>
            <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Percent className="h-4 w-4 sm:h-5 sm:w-5" />
                Comissão Wholesale
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    className={`px-3 py-1.5 text-xs font-medium ${wholesaleInputMode === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                    onClick={() => setWholesaleInputMode('percent')}
                  >
                    <Percent className="h-3 w-3" />
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs font-medium ${wholesaleInputMode === 'value' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                    onClick={() => setWholesaleInputMode('value')}
                  >
                    <DollarSign className="h-3 w-3" />
                  </button>
                </div>

                {wholesaleInputMode === 'percent' ? (
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={wholesalePct}
                      onChange={(e) => setWholesalePct(e.target.value)}
                      placeholder="10"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                  </div>
                ) : (
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={wholesaleValue}
                      onChange={(e) => setWholesaleValue(e.target.value)}
                      placeholder="30000"
                      className="pl-8"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* RESULT - MAO Breakdown */}
          {calculations && (
            <Card className="border-2 border-primary bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Calculator className="h-5 w-5 sm:h-6 sm:w-6" />
                  Resultado MAO
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 space-y-3">
                {/* Breakdown */}
                <div className="space-y-2">
                  {/* ARV */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <p className="text-xs text-muted-foreground">ARV (After Repair Value)</p>
                      <p className="text-[10px] text-muted-foreground">
                        {calculations.sqft.toLocaleString()} sqft x ${calculations.avgPricePerSqft}/sqft
                      </p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-green-700">
                      {formatCurrency(calculations.arv)}
                    </p>
                  </div>

                  {/* Renovation */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Reforma ({RENOVATION_LABELS[renovationType]})
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {calculations.renovationPctCalc.toFixed(1)}% do ARV
                        </p>
                      </div>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-red-600">
                      -{formatCurrency(calculations.renovationCost)}
                    </p>
                  </div>

                  {/* Wholesale */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Comissão Wholesale</p>
                        <p className="text-[10px] text-muted-foreground">
                          {calculations.wholesalePctCalc.toFixed(1)}% do ARV
                        </p>
                      </div>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-red-600">
                      -{formatCurrency(calculations.wholesaleCost)}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t-2 border-dashed border-primary pt-2" />

                  {/* MAO Result */}
                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border-2 border-primary">
                    <div>
                      <p className="text-sm font-bold text-primary">OFERTA MÁXIMA (MAO)</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {calculations.arv > 0 ? `${((calculations.mao / calculations.arv) * 100).toFixed(1)}% do ARV` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl sm:text-3xl font-bold text-primary">
                        {formatCurrency(calculations.mao)}
                      </p>
                      <Button variant="ghost" size="sm" onClick={handleCopyMAO} className="h-8 w-8 p-0">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar MAO'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No sqft warning */}
          {selectedProperty && !selectedProperty.square_feet && (
            <Card className="border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-semibold">Área construída não informada</p>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                A propriedade precisa ter a metragem (sqft) cadastrada para calcular o ARV.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
