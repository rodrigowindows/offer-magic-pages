import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { QueueProperty } from './types';
import { getScoreColor, getLeadScoreColor } from './constants';
import { formatCurrency } from '@/lib/utils';

interface ScoresTableProps {
  property: QueueProperty;
  onScoreSaved?: () => void;
  avgCompPrice?: number | null;
  expanded?: boolean;
}

const Tip = ({ text, tip }: { text: string; tip: string }) => (
  <span title={tip} className="cursor-help border-b border-dotted border-muted-foreground/50">
    {text}
  </span>
);

export const ScoresTable = ({ property, avgCompPrice }: ScoresTableProps) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const aiC = getScoreColor(property.ai_score);
  const leadC = getLeadScoreColor(property.lead_score ?? null);

  const pricePsf = property.estimated_value && property.square_feet && property.square_feet > 0
    ? Math.round(property.estimated_value / property.square_feet)
    : null;

  const isUnincorporated = (property.address || '').toUpperCase().includes('UNINCORPORATED');

  const offerPct = property.cash_offer_amount && property.estimated_value && property.estimated_value > 0
    ? Math.round((property.cash_offer_amount / property.estimated_value) * 100)
    : null;

  // ARV-based offer percentage (more useful than estimated value based)
  const offerArvPct = property.cash_offer_amount && property.arv && property.arv > 0
    ? Math.round((property.cash_offer_amount / property.arv) * 100)
    : null;

  // Last sale price anomaly detection
  const priceAnomaly = property.last_sale_price && property.estimated_value && property.last_sale_price > 0
    ? Math.round(((property.estimated_value - property.last_sale_price) / property.last_sale_price) * 100)
    : null;

  return (
    <div className="border rounded overflow-hidden" data-section="scores-table">
      {/* Unincorporated warning */}
      {isUnincorporated && (
        <div className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 text-[10px] text-amber-800 dark:text-amber-300">
          <Tip text="UNINCORPORATED" tip="Área não incorporada = fora dos limites da cidade." /> — Fora dos limites da cidade.
        </div>
      )}

      {/* Last sale price anomaly warning */}
      {priceAnomaly !== null && Math.abs(priceAnomaly) > 30 && (
        <div className="px-2 py-0.5 bg-red-50 border-b border-red-200 text-[10px] text-red-800 font-semibold">
          ⚠️ Preço anterior: {formatCurrency(property.last_sale_price!)}
          {property.last_sale_date && <span className="font-normal"> ({new Date(property.last_sale_date).toLocaleDateString('pt-BR')})</span>}
          {' → '} Estimado: {formatCurrency(property.estimated_value)} ({priceAnomaly > 0 ? '+' : ''}{priceAnomaly}%)
        </div>
      )}

      {/* Main data grid - 3-4 columns */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-px bg-border">
        {/* Score with reasoning toggle */}
        <div className="bg-card px-2.5 py-2 cursor-pointer" onClick={() => property.ai_reasoning && setShowReasoning(!showReasoning)}>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Tip text="Score" tip="70+ = FORTE, 50-69 = REVISAR, 30-49 = ATENÇÃO, <30 = FRACO" />
            {property.ai_reasoning && (showReasoning ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
          </p>
          <div className="flex items-center gap-1 mt-0.5" data-field="ai-score">
            <span className={`font-extrabold text-2xl ${aiC.text}`}>{property.ai_score ?? '—'}</span>
            {property.ai_score != null && (
              <Badge variant="outline" className={`text-[9px] px-1 leading-tight ${aiC.text} ${aiC.bg} ${aiC.border}`}>{aiC.label}</Badge>
            )}
          </div>
        </div>

        {/* Lead Score (Step 2) */}
        {property.lead_score != null && (
          <div className="bg-card px-2.5 py-2">
            <p className="text-xs text-muted-foreground font-medium">
              <Tip text="Lead Sc." tip="Score do Step 2 (pipeline) — quanto maior melhor" />
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`font-extrabold text-2xl ${leadC.text}`}>{property.lead_score}</span>
              <Badge variant="outline" className={`text-[9px] px-1 leading-tight ${leadC.text}`}>{leadC.label}</Badge>
            </div>
          </div>
        )}

        {/* Preço */}
        <div className="bg-card px-2.5 py-2">
          <p className="text-xs text-muted-foreground font-medium">Preço</p>
          <p className="font-bold text-lg mt-0.5" data-field="price">
            {property.estimated_value ? formatCurrency(property.estimated_value) : '—'}
          </p>
        </div>

        {/* Oferta */}
        <div className="bg-card px-2.5 py-2">
          <p className="text-xs text-muted-foreground font-medium">Oferta</p>
          <div className="flex items-center gap-1 mt-0.5" data-field="offer">
            <span className="font-bold text-lg">
              {property.cash_offer_amount ? formatCurrency(property.cash_offer_amount) : '—'}
            </span>
            {offerPct != null && (
              <Badge variant={offerPct <= 70 ? 'default' : 'secondary'} className="text-[9px] px-1">{offerPct}%</Badge>
            )}
          </div>
        </div>

        {/* Sqft + market comparison */}
        <div className="bg-card px-2.5 py-2">
          <p className="text-xs text-muted-foreground font-medium">Sqft</p>
          <div className="mt-0.5" data-field="sqft">
            <span className="font-bold text-lg">{property.square_feet ? property.square_feet.toLocaleString() : '—'}</span>
            {pricePsf && <span className="text-muted-foreground text-[10px] ml-1">${pricePsf}</span>}
            {property.avg_price_per_sqft && pricePsf && (
              <span className={`text-[9px] ml-1 ${pricePsf < property.avg_price_per_sqft * 0.8 ? 'text-emerald-600 font-bold' : 'text-muted-foreground'}`}>
                (mkt ${Math.round(property.avg_price_per_sqft)})
              </span>
            )}
          </div>
        </div>

        {/* Q/B */}
        <div className="bg-card px-2.5 py-2">
          <p className="text-xs text-muted-foreground font-medium">Q/B</p>
          <p className="font-bold text-lg mt-0.5">{property.bedrooms || '—'}/{property.bathrooms || '—'}</p>
        </div>

        {/* Ano */}
        <div className="bg-card px-2.5 py-2">
          <p className="text-xs text-muted-foreground font-medium">Ano</p>
          <p className="font-bold text-lg mt-0.5">{property.year_built || '—'}</p>
        </div>

        {/* Tipo */}
        <div className="bg-card px-2.5 py-2">
          <p className="text-xs text-muted-foreground font-medium">Tipo</p>
          <p className="font-bold text-sm leading-tight mt-0.5">{property.property_type || '—'}</p>
        </div>

        {/* Lote */}
        {property.lot_size != null && property.lot_size > 0 && (
          <div className="bg-card px-2.5 py-2">
            <p className="text-xs text-muted-foreground font-medium">Lote</p>
            <p className="font-bold text-lg mt-0.5">{property.lot_size.toLocaleString()}</p>
          </div>
        )}

        {/* ARV - NEW */}
        {property.arv != null && property.arv > 0 && (
          <div className="bg-card px-2.5 py-2">
            <p className="text-xs text-muted-foreground font-medium">
              <Tip text="ARV" tip="After Repair Value - valor após reforma" />
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-bold text-lg text-blue-600">{formatCurrency(property.arv)}</span>
              {offerArvPct != null && (
                <Badge variant={offerArvPct <= 70 ? 'default' : offerArvPct <= 85 ? 'secondary' : 'destructive'} className="text-[9px] px-1">
                  {offerArvPct}%
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Avg Comps */}
        {avgCompPrice != null && avgCompPrice > 0 && (
          <div className="bg-card px-2.5 py-2">
            <p className="text-xs text-muted-foreground font-medium">
              <Tip text="Comps" tip="Média de preço dos comps salvos" />
            </p>
            <p className="font-bold text-lg text-blue-600 mt-0.5" data-field="avg-comps">{formatCurrency(avgCompPrice)}</p>
          </div>
        )}

        {/* MAO */}
        {property.mao != null && (
          <div className="bg-card px-2.5 py-2">
            <p className="text-xs text-muted-foreground font-medium">
              <Tip text="MAO" tip="Maximum Allowable Offer" />
            </p>
            <p className="font-bold text-lg text-blue-600 mt-0.5" data-field="mao">{formatCurrency(property.mao)}</p>
          </div>
        )}
      </div>

      {/* AI Reasoning - expandable */}
      {showReasoning && property.ai_reasoning && (
        <div className="px-2 py-1 bg-blue-50 dark:bg-blue-950/30 border-t text-[10px] text-blue-900 dark:text-blue-200 italic">
          💡 {property.ai_reasoning}
        </div>
      )}

      {/* Financial analysis row - wholesale + renovation */}
      {(property.wholesale_value || property.renovation_value) && (
        <div className="flex items-center px-1.5 py-0.5 gap-3 flex-wrap border-t border-border/50 bg-card text-[10px]">
          {property.renovation_value != null && (
            <div>
              <span className="text-muted-foreground font-medium">Reforma: </span>
              <span className="font-bold">{formatCurrency(property.renovation_value)}</span>
              {property.renovation_pct != null && <span className="text-muted-foreground"> ({property.renovation_pct}%)</span>}
            </div>
          )}
          {property.wholesale_value != null && (
            <div>
              <span className="text-muted-foreground font-medium">Wholesale: </span>
              <span className={`font-bold ${(property.wholesale_pct ?? 0) < 15 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatCurrency(property.wholesale_value)}
              </span>
              {property.wholesale_pct != null && <span className="text-muted-foreground"> ({property.wholesale_pct}%)</span>}
            </div>
          )}
        </div>
      )}

      {/* Tax info row */}
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
