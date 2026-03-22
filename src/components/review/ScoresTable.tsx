import { Badge } from '@/components/ui/badge';
import type { QueueProperty } from './types';
import { getScoreColor, getLeadScoreColor } from './constants';
import { AIScoreInput } from './AIScoreInput';
import { formatCurrency } from '@/lib/utils';

interface ScoresTableProps {
  property: QueueProperty;
  onScoreSaved?: () => void;
  avgCompPrice?: number | null;
  /** Expanded mode: use grid layout for wider displays */
  expanded?: boolean;
}

/** Tooltip wrapper for technical terms */
const Tip = ({ text, tip }: { text: string; tip: string }) => (
  <span title={tip} className="cursor-help border-b border-dotted border-muted-foreground/50">
    {text}
  </span>
);

export const ScoresTable = ({ property, onScoreSaved, avgCompPrice, expanded }: ScoresTableProps) => {
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

  if (expanded) {
    return (
      <div className="border rounded-lg overflow-hidden text-sm" data-section="scores-table">
        {/* Unincorporated warning */}
        {isUnincorporated && (
          <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            <Tip text="UNINCORPORATED" tip="Área não incorporada = fora dos limites da cidade." /> — Fora dos limites da cidade.
          </div>
        )}

        {/* Grid layout for expanded view - 2 rows */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-px bg-border">
          {/* AI Score */}
          <div className="bg-card px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium">
              <Tip text="AI Score" tip="70+ = COMPRAR, 50-69 = AVALIAR, <30 = FRACO" />
            </p>
            <div className="flex items-center gap-1" data-field="ai-score">
              <span className={`font-bold text-lg ${aiC.text}`}>{property.ai_score ?? '—'}</span>
              {property.ai_score != null && (
                <Badge variant="outline" className={`text-[9px] ${aiC.text} ${aiC.bg} ${aiC.border}`}>{aiC.label}</Badge>
              )}
            </div>
          </div>

          {/* Lead */}
          <div className="bg-card px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium">
              <Tip text="Lead" tip="230+ = ALTA, 150-229 = PADRÃO, <150 = BAIXA" />
            </p>
            <div className="flex items-center gap-1" data-field="lead-score">
              <span className={`font-bold text-lg ${ldC.text}`}>{property.lead_score ?? '—'}</span>
              {property.lead_score != null && (
                <span className={`text-[10px] font-bold ${ldC.text}`}>{ldC.label}</span>
              )}
            </div>
          </div>

          {/* Preço */}
          <div className="bg-card px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium">Preço</p>
            <p className="font-bold text-lg" data-field="price">
              {property.estimated_value ? formatCurrency(property.estimated_value) : '—'}
            </p>
          </div>

          {/* Oferta */}
          <div className="bg-card px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium">Oferta</p>
            <div className="flex items-center gap-1" data-field="offer">
              <span className="font-bold text-lg">
                {property.cash_offer_amount ? formatCurrency(property.cash_offer_amount) : '—'}
              </span>
              {discountPct != null && (
                <Badge variant={discountPct >= 35 ? 'default' : 'secondary'} className="text-[10px]">-{discountPct}%</Badge>
              )}
            </div>
          </div>

          {/* Avg Comps */}
          {avgCompPrice != null && avgCompPrice > 0 && (
            <div className="bg-card px-3 py-2">
              <p className="text-[10px] text-muted-foreground font-medium">
                <Tip text="Comps Avg" tip="Média de preço dos 3 comps mais recentes" />
              </p>
              <p className="font-bold text-lg" data-field="avg-comps">{formatCurrency(avgCompPrice)}</p>
            </div>
          )}

          {/* MAO */}
          {property.mao != null && (
            <div className="bg-card px-3 py-2">
              <p className="text-[10px] text-muted-foreground font-medium">
                <Tip text="MAO" tip="Maximum Allowable Offer — valor máximo que deve pagar" />
              </p>
              <p className="font-bold text-lg text-blue-600" data-field="mao">{formatCurrency(property.mao)}</p>
            </div>
          )}

          {/* Sqft */}
          <div className="bg-card px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium">Sqft</p>
            <div data-field="sqft">
              <span className="font-bold text-lg">{property.square_feet ? property.square_feet.toLocaleString() : '—'}</span>
              {pricePsf && <span className="text-muted-foreground text-xs ml-1">(${pricePsf}/sqft)</span>}
            </div>
          </div>

          {/* Lote */}
          {property.lot_size != null && property.lot_size > 0 && (
            <div className="bg-card px-3 py-2">
              <p className="text-[10px] text-muted-foreground font-medium">Lote</p>
              <p className="font-bold text-lg">{property.lot_size.toLocaleString()}</p>
            </div>
          )}

          {/* Q/B */}
          <div className="bg-card px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium">Q/B</p>
            <p className="font-bold text-lg">{property.bedrooms || '—'}/{property.bathrooms || '—'}</p>
          </div>

          {/* Ano */}
          <div className="bg-card px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium">Ano</p>
            <p className="font-bold text-lg">{property.year_built || '—'}</p>
          </div>

          {/* Tipo */}
          <div className="bg-card px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium">Tipo</p>
            <p className="font-bold text-base">{property.property_type || '—'}</p>
          </div>

          {/* Meu Score */}
          <div className="bg-card px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium">Meu Score</p>
            <AIScoreInput propertyId={property.id} currentScore={property.ai_score} currentReasoning={property.ai_reasoning} onSaved={onScoreSaved} inline />
          </div>
        </div>

        {/* Tax info row */}
        {(property.total_tax_due || property.years_delinquent || property.taxable_value) && (
          <div className="flex items-center px-3 py-1.5 gap-3 flex-wrap border-t border-border/50 bg-card">
            {property.total_tax_due != null && (
              <div>
                <span className="text-muted-foreground font-medium text-xs">Tax Due: </span>
                <span className="font-bold text-destructive">${Number(property.total_tax_due).toLocaleString()}</span>
              </div>
            )}
            {property.years_delinquent != null && property.years_delinquent > 0 && (
              <div>
                <span className="text-muted-foreground font-medium text-xs">Delinquent: </span>
                <span className="font-bold text-destructive">{property.years_delinquent} yr{property.years_delinquent > 1 ? 's' : ''}</span>
              </div>
            )}
            {property.taxable_value != null && (
              <div>
                <span className="text-muted-foreground font-medium text-xs">Taxable: </span>
                <span className="font-bold">${Number(property.taxable_value).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Original compact layout (fallback)
  return (
    <div className="border rounded-lg overflow-hidden text-sm" data-section="scores-table">
      {isUnincorporated && (
        <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
          <Tip text="UNINCORPORATED" tip="Área não incorporada = fora dos limites da cidade." /> — Fora dos limites da cidade.
        </div>
      )}
      <div className="divide-y">
        <div className="flex items-center px-3 py-1.5">
          <span className="text-muted-foreground font-medium w-16 shrink-0"><Tip text="AI Score" tip="70+ = COMPRAR, 50-69 = AVALIAR, <30 = FRACO" /></span>
          <div className="flex-1" data-field="ai-score">
            <span className={`font-bold text-base ${aiC.text}`}>{property.ai_score ?? '—'}</span>
            {property.ai_score != null && <Badge variant="outline" className={`ml-1 text-[10px] ${aiC.text} ${aiC.bg} ${aiC.border}`}>{aiC.label}</Badge>}
          </div>
        </div>
        <div className="flex items-center px-3 py-1.5">
          <span className="text-muted-foreground font-medium w-16 shrink-0"><Tip text="Lead" tip="230+ = ALTA, 150-229 = PADRÃO, <150 = BAIXA" /></span>
          <div className="flex-1" data-field="lead-score">
            <span className={`font-bold text-base ${ldC.text}`}>{property.lead_score ?? '—'}</span>
            {property.lead_score != null && <span className={`ml-1 text-xs font-bold ${ldC.text}`}>{ldC.label}</span>}
          </div>
        </div>
        <div className="flex items-center px-3 py-1.5">
          <span className="text-muted-foreground font-medium w-16 shrink-0">Meu</span>
          <div className="flex-1">
            <AIScoreInput propertyId={property.id} currentScore={property.ai_score} currentReasoning={property.ai_reasoning} onSaved={onScoreSaved} inline />
          </div>
        </div>
        <div className="flex items-center px-3 py-1.5">
          <span className="text-muted-foreground font-medium w-16 shrink-0">Preço</span>
          <div className="flex-1 font-bold text-base" data-field="price">{property.estimated_value ? formatCurrency(property.estimated_value) : '—'}</div>
        </div>
        <div className="flex items-center px-3 py-1.5">
          <span className="text-muted-foreground font-medium w-16 shrink-0">Oferta</span>
          <div className="flex-1 font-bold text-base" data-field="offer">
            {property.cash_offer_amount ? formatCurrency(property.cash_offer_amount) : '—'}
            {discountPct != null && <Badge variant={discountPct >= 35 ? 'default' : 'secondary'} className="ml-1 text-[10px]">-{discountPct}%</Badge>}
          </div>
        </div>
        {avgCompPrice != null && avgCompPrice > 0 && (
          <div className="flex items-center px-3 py-1.5">
            <span className="text-muted-foreground font-medium w-16 shrink-0"><Tip text="Comps" tip="Média de preço dos 3 comps mais recentes" /></span>
            <div className="flex-1 text-base text-muted-foreground" data-field="avg-comps">Avg: <span className="font-bold text-foreground">{formatCurrency(avgCompPrice)}</span></div>
          </div>
        )}
        {property.mao != null && (
          <div className="flex items-center px-3 py-1.5">
            <span className="text-muted-foreground font-medium w-16 shrink-0"><Tip text="MAO" tip="Maximum Allowable Offer — valor máximo que deve pagar" /></span>
            <div className="flex-1 font-bold text-base text-blue-600" data-field="mao">{formatCurrency(property.mao)}</div>
          </div>
        )}
        <div className="flex items-center px-3 py-1.5">
          <span className="text-muted-foreground font-medium w-16 shrink-0">Sqft</span>
          <div className="flex-1 font-bold text-base" data-field="sqft">
            {property.square_feet ? property.square_feet.toLocaleString() : '—'}
            {pricePsf && <span className="text-muted-foreground text-xs ml-1 font-normal">(${pricePsf}/sqft)</span>}
            {property.lot_size != null && property.lot_size > 0 && <span className="text-muted-foreground text-xs ml-2 font-normal">Lote: {property.lot_size.toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex items-center px-3 py-1.5 gap-3 flex-wrap">
          <div><span className="text-muted-foreground font-medium">Q/B: </span><span className="font-bold">{property.bedrooms || '—'}/{property.bathrooms || '—'}</span></div>
          <div><span className="text-muted-foreground font-medium">Ano: </span><span className="font-bold">{property.year_built || '—'}</span></div>
          <div><span className="text-muted-foreground font-medium">Tipo: </span><span className="font-bold">{property.property_type || '—'}</span></div>
        </div>
        {(property.total_tax_due || property.years_delinquent || property.taxable_value) && (
          <div className="flex items-center px-3 py-1.5 gap-3 flex-wrap border-t border-border/50">
            {property.total_tax_due != null && <div><span className="text-muted-foreground font-medium">Tax Due: </span><span className="font-bold text-destructive">${Number(property.total_tax_due).toLocaleString()}</span></div>}
            {property.years_delinquent != null && property.years_delinquent > 0 && <div><span className="text-muted-foreground font-medium">Delinquent: </span><span className="font-bold text-destructive">{property.years_delinquent} yr{property.years_delinquent > 1 ? 's' : ''}</span></div>}
            {property.taxable_value != null && <div><span className="text-muted-foreground font-medium">Taxable: </span><span className="font-bold">${Number(property.taxable_value).toLocaleString()}</span></div>}
          </div>
        )}
      </div>
    </div>
  );
};
