import { Badge } from '@/components/ui/badge';
import type { QueueProperty } from './types';
import { getScoreColor, getLeadScoreColor } from './constants';
import { AIScoreInput } from './AIScoreInput';
import { formatCurrency } from '@/lib/utils';

interface ScoresTableProps {
  property: QueueProperty;
  onScoreSaved?: () => void;
  avgCompPrice?: number | null;
}

/** Tooltip wrapper for technical terms */
const Tip = ({ text, tip }: { text: string; tip: string }) => (
  <span title={tip} className="cursor-help border-b border-dotted border-muted-foreground/50">
    {text}
  </span>
);

export const ScoresTable = ({ property, onScoreSaved, avgCompPrice }: ScoresTableProps) => {
  const aiC = getScoreColor(property.ai_score);
  const ldC = getLeadScoreColor(property.lead_score);
  const pricePsf = property.estimated_value && property.square_feet && property.square_feet > 0
    ? Math.round(property.estimated_value / property.square_feet)
    : null;
  const discountPct = property.cash_offer_amount && avgCompPrice && avgCompPrice > 0
    ? Math.round(((avgCompPrice - property.cash_offer_amount) / avgCompPrice) * 100)
    : null;

  // Detect UNINCORPORATED in address
  const isUnincorporated = (property.address || '').toUpperCase().includes('UNINCORPORATED');

  return (
    <div className="border rounded-lg overflow-hidden text-[11px]" data-section="scores-table">
      {/* Unincorporated warning */}
      {isUnincorporated && (
        <div className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-[10px] text-amber-800 dark:text-amber-300">
          <Tip text="UNINCORPORATED" tip="Área não incorporada = fora dos limites da cidade." /> — Fora dos limites da cidade.
        </div>
      )}
      <div className="divide-y">
        {/* AI Score */}
        <div className="flex items-center px-2 py-0.5">
          <span className="text-muted-foreground font-medium w-14 shrink-0">
            <Tip text="AI Score" tip="70+ = COMPRAR, 50-69 = AVALIAR, <30 = FRACO" />
          </span>
          <div className="flex-1" data-field="ai-score">
            <span className={`font-bold text-sm ${aiC.text}`}>{property.ai_score ?? '—'}</span>
            {property.ai_score != null && (
              <Badge variant="outline" className={`ml-1 text-[8px] ${aiC.text} ${aiC.bg} ${aiC.border}`}>{aiC.label}</Badge>
            )}
          </div>
        </div>
        {/* Lead */}
        <div className="flex items-center px-2 py-0.5">
          <span className="text-muted-foreground font-medium w-14 shrink-0">
            <Tip text="Lead" tip="230+ = ALTA, 150-229 = PADRÃO, <150 = BAIXA" />
          </span>
          <div className="flex-1" data-field="lead-score">
            <span className={`font-bold text-sm ${ldC.text}`}>{property.lead_score ?? '—'}</span>
            {property.lead_score != null && (
              <span className={`ml-1 text-[9px] font-bold ${ldC.text}`}>{ldC.label}</span>
            )}
          </div>
        </div>
        {/* Meu Score */}
        <div className="flex items-center px-2 py-0.5">
          <span className="text-muted-foreground font-medium w-14 shrink-0">Meu</span>
          <div className="flex-1">
            <AIScoreInput propertyId={property.id} currentScore={property.ai_score} currentReasoning={property.ai_reasoning} onSaved={onScoreSaved} inline />
          </div>
        </div>
        {/* Preço */}
        <div className="flex items-center px-2 py-0.5">
          <span className="text-muted-foreground font-medium w-14 shrink-0">Preço</span>
          <div className="flex-1 font-bold text-sm" data-field="price">
            {property.estimated_value ? formatCurrency(property.estimated_value) : '—'}
          </div>
        </div>
        {/* Oferta */}
        <div className="flex items-center px-2 py-0.5">
          <span className="text-muted-foreground font-medium w-14 shrink-0">Oferta</span>
          <div className="flex-1 font-bold text-sm" data-field="offer">
            {property.cash_offer_amount ? formatCurrency(property.cash_offer_amount) : '—'}
            {discountPct != null && (
              <Badge variant={discountPct >= 35 ? 'default' : 'secondary'} className="ml-1 text-[8px]">-{discountPct}%</Badge>
            )}
          </div>
        </div>
        {/* Avg Comps */}
        {avgCompPrice != null && avgCompPrice > 0 && (
          <div className="flex items-center px-2 py-0.5">
            <span className="text-muted-foreground font-medium w-14 shrink-0">
              <Tip text="Comps" tip="Média de preço dos 3 comps mais recentes" />
            </span>
            <div className="flex-1 text-sm text-muted-foreground" data-field="avg-comps">
              Avg: <span className="font-bold text-foreground">{formatCurrency(avgCompPrice)}</span>
            </div>
          </div>
        )}
        {/* MAO */}
        {property.mao != null && (
          <div className="flex items-center px-2 py-0.5">
            <span className="text-muted-foreground font-medium w-14 shrink-0">
              <Tip text="MAO" tip="Maximum Allowable Offer — valor máximo que deve pagar" />
            </span>
            <div className="flex-1 font-bold text-sm text-blue-600" data-field="mao">
              {formatCurrency(property.mao)}
            </div>
          </div>
        )}
        {/* Sqft + Lot */}
        <div className="flex items-center px-2 py-0.5">
          <span className="text-muted-foreground font-medium w-14 shrink-0">Sqft</span>
          <div className="flex-1 font-bold text-sm" data-field="sqft">
            {property.square_feet ? property.square_feet.toLocaleString() : '—'}
            {pricePsf && <span className="text-muted-foreground text-[10px] ml-1 font-normal">(${pricePsf}/sqft)</span>}
            {property.lot_size != null && property.lot_size > 0 && (
              <span className="text-muted-foreground text-[10px] ml-2 font-normal">Lote: {property.lot_size.toLocaleString()}</span>
            )}
          </div>
        </div>
        {/* Q/B + Ano + Tipo - compact row */}
        <div className="flex items-center px-2 py-0.5 gap-3 flex-wrap">
          <div>
            <span className="text-muted-foreground font-medium">Q/B: </span>
            <span className="font-bold">{property.bedrooms || '—'}/{property.bathrooms || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Ano: </span>
            <span className="font-bold">{property.year_built || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Tipo: </span>
            <span className="font-bold">{property.property_type || '—'}</span>
          </div>
        </div>
        {/* Tax info row */}
        {(property.total_tax_due || property.years_delinquent || property.taxable_value) && (
          <div className="flex items-center px-2 py-0.5 gap-3 flex-wrap border-t border-border/50">
            {property.total_tax_due != null && (
              <div>
                <span className="text-muted-foreground font-medium">Tax Due: </span>
                <span className="font-bold text-destructive">${Number(property.total_tax_due).toLocaleString()}</span>
              </div>
            )}
            {property.years_delinquent != null && property.years_delinquent > 0 && (
              <div>
                <span className="text-muted-foreground font-medium">Delinquent: </span>
                <span className="font-bold text-destructive">{property.years_delinquent} yr{property.years_delinquent > 1 ? 's' : ''}</span>
              </div>
            )}
            {property.taxable_value != null && (
              <div>
                <span className="text-muted-foreground font-medium">Taxable: </span>
                <span className="font-bold">${Number(property.taxable_value).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
