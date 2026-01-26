/**
 * 📝 Exemplo de Uso: Integrar AttomV2Service no CompsAnalysis Component
 * 
 * Local: src/components/marketing/CompsAnalysis.tsx
 * 
 * Adicione este código nos hooks/callbacks relevantes
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PASSO 1: Importar os novos serviços no topo do arquivo
// ═══════════════════════════════════════════════════════════════════════════════

import AttomV2Service from '@/services/attomV2Service';
import { getCounryByCity } from '@/utils/cityCountyMap';

// ═══════════════════════════════════════════════════════════════════════════════
// PASSO 2: Criar referência do serviço
// ═══════════════════════════════════════════════════════════════════════════════

const attomV2Service = new AttomV2Service(process.env.NEXT_PUBLIC_ATTOM_API_KEY || '');

// ═══════════════════════════════════════════════════════════════════════════════
// PASSO 3: Adicionar esta função para obter comparables com ATTOM V2
// ═══════════════════════════════════════════════════════════════════════════════

const fetchComparablesWithAttomV2 = useCallback(
  async (property: Property) => {
    if (!property) return;

    try {
      setLoadingComps(true);

      console.log('🔍 Fetching comparables using ATTOM V2...');

      // Chamada ao serviço ATTOM V2
      const result = await attomV2Service.fetchComparables(
        property.address || '',
        property.city || 'Orlando',
        property.state || 'FL',
        property.zipCode || '32801'
      );

      if (!result.success || result.comps.length === 0) {
        toast({
          title: 'No Real Data Available',
          description: result.message || 'Falling back to demo data',
          variant: 'destructive'
        });

        // Fallback: Usar dados demo (mesmo que antes)
        // ... código de fallback existente ...
        return;
      }

      // Sucesso! Temos dados reais
      console.log(`✅ Got ${result.comps.length} real comparables from ${result.source}`);

      // Converter para formato interno
      const formattedComps: ComparableProperty[] = result.comps.map((comp, i) => ({
        id: `comp-${i}`,
        address: comp.address,
        city: comp.city,
        state: comp.state,
        zipCode: comp.zipCode,
        saleDate: new Date(comp.saleDate),
        salePrice: comp.salePrice,
        sqft: comp.sqft,
        beds: comp.beds || 0,
        baths: comp.baths || 0,
        distanceMiles: comp.distance || 0,
        pricePerSqft: Math.round((comp.salePrice / comp.sqft) * 100) / 100,
        // ... outros campos ...
      }));

      // Calcular análise
      const avgSalePrice = formattedComps.reduce((sum, c) => sum + c.salePrice, 0) / formattedComps.length;
      const avgPricePerSqft = formattedComps.reduce((sum, c) => sum + c.pricePerSqft, 0) / formattedComps.length;

      const calculatedAnalysis = {
        avgSalePrice,
        medianSalePrice: avgSalePrice,
        avgPricePerSqft,
        suggestedValueMin: avgSalePrice * 0.95,
        suggestedValueMax: avgSalePrice * 1.05,
        trendPercentage: 0,
        marketTrend: 'stable' as const,
        comparablesCount: formattedComps.length,
      };

      // Salvar no banco de dados
      await supabase
        .from('properties')
        .update({
          estimated_value: Math.round(avgSalePrice),
          valuation_method: result.source,
          valuation_confidence: 85, // Confidence médio
          last_valuation_date: new Date().toISOString()
        })
        .eq('id', property.id);

      // Atualizar UI
      setComparables(formattedComps);
      setAnalysis(calculatedAnalysis);

      toast({
        title: '✅ Real Data Found!',
        description: `${result.comps.length} comparable sales from ${result.source}`,
      });

    } catch (error) {
      console.error('Error fetching comparables:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch comparables',
        variant: 'destructive'
      });
    } finally {
      setLoadingComps(false);
    }
  },
  [supabase, toast]
);

// ═══════════════════════════════════════════════════════════════════════════════
// PASSO 4: Usar ao invés da função anterior
// ═══════════════════════════════════════════════════════════════════════════════

// Substituir chamadas a generateComparables() por fetchComparablesWithAttomV2()
// Exemplo:

useEffect(() => {
  if (selectedProperty) {
    // ANTES: await generateComparables(selectedProperty);
    // DEPOIS:
    fetchComparablesWithAttomV2(selectedProperty);
  }
}, [selectedProperty, fetchComparablesWithAttomV2]);

// ═══════════════════════════════════════════════════════════════════════════════
// PASSO 5: Mostrar badge indicando fonte de dados
// ═══════════════════════════════════════════════════════════════════════════════

// No JSX, adicionar:

{analysis && (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">Market Analysis Results</h3>
    <div className="flex gap-2">
      {/* Badge de fonte */}
      {dataSource === 'attom' && (
        <Badge variant="success" className="bg-green-100 text-green-800">
          ✅ Real Data - ATTOM
        </Badge>
      )}
      {dataSource === 'demo' && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          ⚠️ Demo Data
        </Badge>
      )}
      
      {/* Badge de confiança */}
      {confidence && (
        <Badge variant="outline">
          🎯 {Math.round(confidence)}% Confidence
        </Badge>
      )}
    </div>
  </div>
)}

// ═══════════════════════════════════════════════════════════════════════════════
// PASSO 6: Adicionar campo de county no form de propriedade
// ═══════════════════════════════════════════════════════════════════════════════

// Se a propriedade não tem county_name, preencher automaticamente:

const autoFillCounty = (city: string, state: string = 'FL') => {
  const county = getCounryByCity(city, state);
  if (county) {
    setSelectedProperty(prev => prev ? {
      ...prev,
      county_name: county
    } : null);
  }
};

// Chamar quando city mudar:
useEffect(() => {
  if (selectedProperty?.city && !selectedProperty?.county_name) {
    autoFillCounty(selectedProperty.city, selectedProperty.state || 'FL');
  }
}, [selectedProperty?.city]);

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTADO FINAL
// ═══════════════════════════════════════════════════════════════════════════════

/*
ANTES:
┌────────────────────────────────────────┐
│ Market Analysis Results                │
│ ⚠️ Demo Data                           │
├────────────────────────────────────────┤
│ Avg Sale Price: $95,000               │
│ Suggested Value: $90K - $100K         │
│ Comparables: 6 (DEMO)                 │
│ Confidence: Unknown                   │
└────────────────────────────────────────┘

DEPOIS:
┌────────────────────────────────────────┐
│ Market Analysis Results                │
│ ✅ Real Data - ATTOM | 🎯 85% Confidence│
├────────────────────────────────────────┤
│ Avg Sale Price: $112,450              │
│ Suggested Value: $106,827 - $118,073  │
│ Comparables: 6 (REAL - ATTOM)        │
│ Confidence: 85%                       │
└────────────────────────────────────────┘
*/
