/**
 * CompsSummaryCard - Summary stats + quick offer calculator
 * Extracted from ManualCompsManager
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { SavedCompsLink, CompsProperty } from '@/hooks/useManualComps';

const OFFER_TIERS = [
  { label: '60%', percent: 0.60, color: 'text-rose-800 bg-rose-100 border-rose-400' },
  { label: '70%', percent: 0.70, color: 'text-red-700 bg-red-50 border-red-300' },
  { label: '75%', percent: 0.75, color: 'text-orange-700 bg-orange-50 border-orange-300' },
  { label: '80%', percent: 0.80, color: 'text-amber-700 bg-amber-50 border-amber-300' },
  { label: '85%', percent: 0.85, color: 'text-yellow-700 bg-yellow-50 border-yellow-300' },
  { label: '90%', percent: 0.90, color: 'text-green-700 bg-green-50 border-green-300' },
];

interface CompsSummaryCardProps {
  links: SavedCompsLink[];
  properties: CompsProperty[];
  selectedPropertyId: string;
}

export const CompsSummaryCard = ({ links, properties, selectedPropertyId }: CompsSummaryCardProps) => {
  const { toast } = useToast();

  const linksWithData = links.filter(l => l.comp_data?.sale_price && l.comp_data?.square_feet);
  if (linksWithData.length === 0) return null;

  const avgPricePerSqft = linksWithData.reduce((sum, l) => sum + (l.comp_data!.sale_price! / (l.comp_data!.square_feet || 1)), 0) / linksWithData.length;
  const selectedProp = properties.find(p => p.id === selectedPropertyId);
  const propertySqft = selectedProp?.square_feet;

  const avgPrice = propertySqft && propertySqft > 0
    ? Math.round(avgPricePerSqft * propertySqft)
    : linksWithData.reduce((s, l) => s + (l.comp_data!.sale_price || 0), 0) / linksWithData.length;

  const avgSqft = linksWithData.reduce((s, l) => s + (l.comp_data!.square_feet || 0), 0) / linksWithData.length;
  const cashOffer = selectedProp?.cash_offer_amount;

  return (
    <Card className="border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle>📊 Resumo dos Comps & Calculadora</CardTitle>
        <CardDescription>{linksWithData.length} comp{linksWithData.length > 1 ? 's' : ''} com dados completos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Averages */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg border-2 border-green-200">
            <p className="text-xs text-muted-foreground mb-1">{propertySqft ? 'Valor Estimado' : 'Preço Médio'}</p>
            <p className="text-2xl font-bold text-green-700">${Math.round(avgPrice).toLocaleString()}</p>
            {propertySqft && <p className="text-xs text-green-600 mt-1">($/sqft × {propertySqft.toLocaleString()} sqft)</p>}
          </div>
          <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
            <p className="text-xs text-muted-foreground mb-1">{propertySqft ? 'Sqft Propriedade' : 'Sqft Médio'}</p>
            <p className="text-2xl font-bold text-blue-700">{propertySqft ? propertySqft.toLocaleString() : Math.round(avgSqft).toLocaleString()}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
            <p className="text-xs text-muted-foreground mb-1">$/Sqft Médio</p>
            <p className="text-2xl font-bold text-purple-700">${Math.round(avgPricePerSqft)}</p>
          </div>
        </div>

        {/* Current offer vs estimated */}
        {cashOffer && cashOffer > 0 && avgPrice > 0 && (() => {
          const pctDiff = (1 - cashOffer / avgPrice) * 100;
          const isBelow = pctDiff > 0;
          return (
            <div className={`p-3 rounded-lg border-2 ${isBelow ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sua Oferta vs Valor</p>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">${cashOffer.toLocaleString()}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${isBelow ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                      {isBelow ? '↓' : '↑'} {Math.abs(pctDiff).toFixed(1)}% {isBelow ? 'abaixo' : 'acima'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Valor Estimado</p>
                  <p className="text-lg font-semibold text-gray-700">${Math.round(avgPrice).toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Quick offer calculator */}
        <div className="p-4 bg-white rounded-lg border-2 border-dashed border-purple-300">
          <h4 className="font-semibold text-purple-900 mb-3">💰 Calculadora Rápida</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Baseado em ${Math.round(avgPrice).toLocaleString()}
            {propertySqft && ` ($/sqft × ${propertySqft.toLocaleString()} sqft)`}
          </p>
          <div className="grid grid-cols-6 gap-2">
            {OFFER_TIERS.map(offer => {
              const amount = avgPrice * offer.percent;
              return (
                <div
                  key={offer.label}
                  className={`p-3 rounded-lg border-2 ${offer.color} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => {
                    navigator.clipboard.writeText(Math.round(amount).toString());
                    toast({ title: '📋 Copiado!', description: `$${Math.round(amount).toLocaleString()} (${offer.label})` });
                  }}
                >
                  <p className="text-xs font-semibold mb-1">{offer.label}</p>
                  <p className="text-lg font-bold">${Math.round(amount).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">💡 Clique para copiar</p>
        </div>
      </CardContent>
    </Card>
  );
};
