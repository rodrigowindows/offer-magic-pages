import { Badge } from '@/components/ui/badge';
import type { QueueProperty } from './types';
import { getScoreColor } from './constants';
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
  const pricePsf = property.estimated_value && property.square_feet && property.square_feet > 0
    ? Math.round(property.estimated_value / property.square_feet)
    : null;

  // Detect UNINCORPORATED in address
  const isUnincorporated = (property.address || '').toUpperCase().includes('UNINCORPORATED');

  // Calculate offer discount from estimated value
  const offerPct = property.cash_offer_amount && property.estimated_value && property.estimated_value > 0
    ? Math.round((property.cash_offer_amount / property.estimated_value) * 100)
    : null;

  return (
    <div className="border rounded overflow-hidden" data-section="scores-table">
      {/* Unincorporated warning */}
      {isUnincorporated && (
        <div className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 text-[10px] text-amber-800 dark:text-amber-300">
          <Tip text="UNINCORPORATED" tip="Área não incorporada = fora dos limites da cidade." /> — Fora dos limites da cidade.
        </div>
      )}

      {/* Single score + compact data grid - 3-4 columns */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-px bg-border">
        {/* Score (single consolidated) */}
        <div className="bg-card px-1.5 py-1">
          <p className="text-[9px] text-muted-foreground font-medium">
            <Tip text="Score" tip="70+ = FORTE, 50-69 = REVISAR, 30-49 = ATENÇÃO, <30 = FRACO" />
          </p>
          <div className="flex items-center gap-0.5" data-field="ai-score">
            <span className={`font-extrabold text-base ${aiC.text}`}>{property.ai_score ?? '—'}</span>
            {property.ai_score != null && (
              <Badge variant="outline" className={`text-[7px] px-0.5 leading-tight ${aiC.text} ${aiC.bg} ${aiC.border}`}>{aiC.label}</Badge>
            )}
          </div>
        </div>

        {/* Preço */}
        <div className="bg-card px-1.5 py-1">
          <p className="text-[9px] text-muted-foreground font-medium">Preço</p>
          <p className="font-bold text-sm" data-field="price">
            {property.estimated_value ? formatCurrency(property.estimated_value) : '—'}
          </p>
        </div>

        {/* Oferta */}
        <div className="bg-card px-1.5 py-1">
          <p className="text-[9px] text-muted-foreground font-medium">Oferta</p>
          <div className="flex items-center gap-0.5" data-field="offer">
            <span className="font-bold text-sm">
              {property.cash_offer_amount ? formatCurrency(property.cash_offer_amount) : '—'}
            </span>
            {offerPct != null && (
              <Badge variant={offerPct <= 70 ? 'default' : 'secondary'} className="text-[7px] px-0.5">{offerPct}%</Badge>
            )}
          </div>
        </div>

        {/* Sqft */}
        <div className="bg-card px-1.5 py-1">
          <p className="text-[9px] text-muted-foreground font-medium">Sqft</p>
          <div data-field="sqft">
            <span className="font-bold text-sm">{property.square_feet ? property.square_feet.toLocaleString() : '—'}</span>
            {pricePsf && <span className="text-muted-foreground text-[8px] ml-0.5">${pricePsf}</span>}
          </div>
        </div>

        {/* Q/B */}
        <div className="bg-card px-1.5 py-1">
          <p className="text-[9px] text-muted-foreground font-medium">Q/B</p>
          <p className="font-bold text-sm">{property.bedrooms || '—'}/{property.bathrooms || '—'}</p>
        </div>

        {/* Ano */}
        <div className="bg-card px-1.5 py-1">
          <p className="text-[9px] text-muted-foreground font-medium">Ano</p>
          <p className="font-bold text-sm">{property.year_built || '—'}</p>
        </div>

        {/* Tipo */}
        <div className="bg-card px-1.5 py-1">
          <p className="text-[9px] text-muted-foreground font-medium">Tipo</p>
          <p className="font-bold text-xs leading-tight">{property.property_type || '—'}</p>
        </div>

        {/* Lote - only show if has data */}
        {property.lot_size != null && property.lot_size > 0 && (
          <div className="bg-card px-1.5 py-1">
            <p className="text-[9px] text-muted-foreground font-medium">Lote</p>
            <p className="font-bold text-sm">{property.lot_size.toLocaleString()}</p>
          </div>
        )}

        {/* Avg Comps - only show if available */}
        {avgCompPrice != null && avgCompPrice > 0 && (
          <div className="bg-card px-1.5 py-1">
            <p className="text-[9px] text-muted-foreground font-medium">
              <Tip text="Comps" tip="Média de preço dos comps salvos" />
            </p>
            <p className="font-bold text-sm text-blue-600" data-field="avg-comps">{formatCurrency(avgCompPrice)}</p>
          </div>
        )}

        {/* MAO - only show if available */}
        {property.mao != null && (
          <div className="bg-card px-1.5 py-1">
            <p className="text-[9px] text-muted-foreground font-medium">
              <Tip text="MAO" tip="Maximum Allowable Offer" />
            </p>
            <p className="font-bold text-sm text-blue-600" data-field="mao">{formatCurrency(property.mao)}</p>
          </div>
        )}
      </div>

      {/* Tax info row - compact */}
      {(property.total_tax_due || property.years_delinquent || property.taxable_value) && (
        <div className="flex items-center px-1.5 py-0.5 gap-2 flex-wrap border-t border-border/50 bg-card text-[10px]">
          {property.total_tax_due != null && (
            <div>
              <span className="text-muted-foreground font-medium">Tax: </span>
              <span className="font-bold text-destructive">${Number(property.total_tax_due).toLocaleString()}</span>
            </div>
          )}
          {property.years_delinquent != null && property.years_delinquent > 0 && (
            <div>
              <span className="text-muted-foreground font-medium">Del: </span>
              <span className="font-bold text-destructive">{property.years_delinquent}yr</span>
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
  );
};
