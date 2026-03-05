import { Badge } from '@/components/ui/badge';
import type { QueueProperty } from './types';
import { getScoreColor, getLeadScoreColor } from './constants';
import { AIScoreInput } from './AIScoreInput';
import { formatCurrency } from '@/lib/utils';

interface ScoresTableProps {
  property: QueueProperty;
  onScoreSaved?: () => void;
}

/** Tooltip wrapper for technical terms */
const Tip = ({ text, tip }: { text: string; tip: string }) => (
  <span title={tip} className="cursor-help border-b border-dotted border-muted-foreground/50">
    {text}
  </span>
);

export const ScoresTable = ({ property, onScoreSaved }: ScoresTableProps) => {
  const aiC = getScoreColor(property.ai_score);
  const ldC = getLeadScoreColor(property.lead_score);
  const pricePsf = property.estimated_value && property.square_feet && property.square_feet > 0
    ? Math.round(property.estimated_value / property.square_feet)
    : null;
  const offerPct = property.cash_offer_amount && property.estimated_value && property.estimated_value > 0
    ? Math.round((property.cash_offer_amount / property.estimated_value) * 100)
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
            {offerPct != null && (
              <Badge variant={offerPct <= 70 ? 'default' : 'secondary'} className="ml-1 text-[8px]">{offerPct}%</Badge>
            )}
          </div>
        </div>
        {/* Sqft */}
        <div className="flex items-center px-2 py-0.5">
          <span className="text-muted-foreground font-medium w-14 shrink-0">Sqft</span>
          <div className="flex-1 font-bold text-sm" data-field="sqft">
            {property.square_feet ? property.square_feet.toLocaleString() : '—'}
            {pricePsf && <span className="text-muted-foreground text-[10px] ml-1 font-normal">(${pricePsf}/sqft)</span>}
          </div>
        </div>
        {/* Q/B + Ano + Tipo - compact row */}
        <div className="flex items-center px-2 py-0.5 gap-3">
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
      </div>
    </div>
  );
};
